const Trade = require("../models/Trade");
const RiskEvent = require("../models/RiskEvent");
const { getRulesByTier, buildRuleMap } = require("./dynamicRiskEngine");

const R11_CODE = "R11_CUMULATIVE_PORTFOLIO_CONCENTRATION";
const R12_CODE = "R12_AGGREGATE_CAPITAL_BURN_RATE";

const createBaseEvent = (rule, details) => {
    return {
        eventType: "AUDIT_TRIGGERED",
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        tier: "POST_TRADE",
        action: rule.action || "AUDIT",
        severity: rule.severity || "MEDIUM",
        riskWeight: rule.riskWeight || 0,
        quantity: 0,
        price: 0,
        tradeType: null,
        ...details
    };
};

const buildConcentrationEvents = (dailySymbolTotals, rule) => {
    const maxConcentration = Number(
        rule.parameters?.maxSymbolConcentrationPercent ?? 70
    );
    const traders = new Map();

    dailySymbolTotals.forEach((item) => {
        const traderId = item._id.traderId;
        const current = traders.get(traderId) || {
            traderId,
            traderName: item._id.traderName,
            totalNotional: 0,
            symbols: []
        };

        current.totalNotional += Number(item.totalNotional || 0);
        current.symbols.push({
            stockSymbol: item._id.stockSymbol,
            totalNotional: Number(item.totalNotional || 0)
        });
        traders.set(traderId, current);
    });

    return Array.from(traders.values()).flatMap((trader) => {
        return trader.symbols
            .map((symbol) => ({
                ...symbol,
                concentrationPercent: trader.totalNotional > 0
                    ? symbol.totalNotional / trader.totalNotional * 100
                    : 0
            }))
            .filter((symbol) => symbol.concentrationPercent > maxConcentration)
            .map((symbol) => createBaseEvent(rule, {
                traderId: trader.traderId,
                traderName: trader.traderName,
                stockSymbol: symbol.stockSymbol,
                tradeValue: symbol.totalNotional,
                reason: `Trader ${trader.traderId} has ${symbol.concentrationPercent.toFixed(2)}% of today's ${trader.totalNotional.toFixed(2)} notional concentrated in ${symbol.stockSymbol}, above the ${maxConcentration}% threshold`
            }));
    });
};

const buildBurnRateEvents = (hourlyTraderTotals, dailySymbolTotals, rule) => {
    const hourlyBurnThresholdPercent = Number(
        rule.parameters?.hourlyBurnThresholdPercent ?? 60
    );
    const hourlyNotionalThreshold = Number(
        rule.parameters?.hourlyNotionalThreshold || 0
    );
    const dailyTotals = new Map();

    dailySymbolTotals.forEach((item) => {
        const traderId = item._id.traderId;
        dailyTotals.set(
            traderId,
            (dailyTotals.get(traderId) || 0) + Number(item.totalNotional || 0)
        );
    });

    return hourlyTraderTotals.flatMap((item) => {
        const hourlyNotional = Number(item.hourlyNotional || 0);
        const dailyNotional = dailyTotals.get(item._id.traderId) || hourlyNotional;
        const burnPercent = dailyNotional > 0
            ? hourlyNotional / dailyNotional * 100
            : 0;
        const exceedsThreshold = hourlyNotionalThreshold > 0
            ? hourlyNotional > hourlyNotionalThreshold
            : burnPercent > hourlyBurnThresholdPercent;

        if (!exceedsThreshold) {
            return [];
        }

        const thresholdReason = hourlyNotionalThreshold > 0
            ? `above the configured ${hourlyNotionalThreshold.toFixed(2)} hourly threshold`
            : `${burnPercent.toFixed(2)}% of today's ${dailyNotional.toFixed(2)} notional, above the ${hourlyBurnThresholdPercent}% threshold`;

        return [createBaseEvent(rule, {
            traderId: item._id.traderId,
            traderName: item._id.traderName,
            stockSymbol: "",
            tradeValue: hourlyNotional,
            reason: `Trader ${item._id.traderId} used ${hourlyNotional.toFixed(2)} notional in the last hour, ${thresholdReason}`
        })];
    });
};

const runPostTradeAudit = async ({ now = new Date() } = {}) => {
    const rules = await getRulesByTier("POST_TRADE");
    const ruleMap = buildRuleMap(rules);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const hourStart = new Date(now.getTime() - 60 * 60 * 1000);

    const [dailySymbolTotals, hourlyTraderTotals] = await Promise.all([
        Trade.aggregate([
            {
                $match: {
                    tradeTime: {
                        $gte: dayStart,
                        $lte: now
                    }
                }
            },
            {
                $group: {
                    _id: {
                        traderId: "$traderId",
                        traderName: "$traderName",
                        stockSymbol: "$stockSymbol"
                    },
                    totalNotional: { $sum: "$tradeValue" }
                }
            }
        ]),
        Trade.aggregate([
            {
                $match: {
                    tradeTime: {
                        $gte: hourStart,
                        $lte: now
                    }
                }
            },
            {
                $group: {
                    _id: {
                        traderId: "$traderId",
                        traderName: "$traderName"
                    },
                    hourlyNotional: { $sum: "$tradeValue" }
                }
            }
        ])
    ]);

    const events = [];

    if (ruleMap[R11_CODE]) {
        events.push(...buildConcentrationEvents(
            dailySymbolTotals,
            ruleMap[R11_CODE]
        ));
    }

    if (ruleMap[R12_CODE]) {
        events.push(...buildBurnRateEvents(
            hourlyTraderTotals,
            dailySymbolTotals,
            ruleMap[R12_CODE]
        ));
    }

    return events.length > 0
        ? RiskEvent.insertMany(events)
        : [];
};

module.exports = {
    buildBurnRateEvents,
    buildConcentrationEvents,
    runPostTradeAudit
};
