const { getRulesByTier, buildRuleMap } = require("./dynamicRiskEngine");
const Order = require("../models/Order");
const {
    recordTradeVelocity,
    recordSameSideMomentum
} = require("./redisRiskWindow");

const { runCppRiskEngine } = require("./cppRiskEngineService");

const calculateSeverityFromScore = (riskScore) => {
    if (riskScore >= 70) {
        return "HIGH";
    }

    if (riskScore >= 30) {
        return "MEDIUM";
    }

    return "LOW";
};

const getTradeTime = (trade) => {
    return trade.tradeTime ? new Date(trade.tradeTime) : new Date();
};

const getWindowStart = (tradeTime, seconds) => {
    return new Date(tradeTime.getTime() - seconds * 1000);
};

const addTriggeredRule = (result, rule, reason) => {
    result.riskScore += rule.riskWeight || 0;

    result.triggeredRules.push(rule.ruleCode);
    result.reasons.push(reason);

    result.ruleDetails.push({
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        severity: rule.severity,
        riskWeight: rule.riskWeight,
        action: rule.action,
        reason
    });
};

const buildEmptyRiskResult = (evaluationEngine) => {
    return {
        isRisky: false,
        riskScore: 0,
        severity: "LOW",
        triggeredRules: [],
        reasons: [],
        ruleDetails: [],
        evaluationEngine
    };
};

const finalizeRiskResult = (result) => {
    result.riskScore = Math.min(result.riskScore, 100);
    result.severity = calculateSeverityFromScore(result.riskScore);
    result.isRisky = result.triggeredRules.length > 0;

    return result;
};

const buildResultFromCpp = (cppResult, ruleMap, excludedRuleCodes = []) => {
    const ruleDetails = (cppResult.ruleDetails || [])
        .filter((detail) => {
            return (
                ruleMap[detail.ruleCode] &&
                !excludedRuleCodes.includes(detail.ruleCode)
            );
        })
        .map((detail) => {
            const rule = ruleMap[detail.ruleCode];

            return {
                ruleCode: rule.ruleCode,
                ruleName: rule.ruleName,
                severity: rule.severity,
                riskWeight: rule.riskWeight,
                action: rule.action,
                reason: detail.reason
            };
        });

    return {
        isRisky: ruleDetails.length > 0,
        riskScore: ruleDetails.reduce((score, rule) => score + (rule.riskWeight || 0), 0),
        severity: "LOW",
        triggeredRules: ruleDetails.map((rule) => rule.ruleCode),
        reasons: ruleDetails.map((rule) => rule.reason),
        ruleDetails,
        evaluationEngine: cppResult.evaluationEngine
    };
};

const calculateDifferencePercent = (firstValue, secondValue) => {
    const first = Number(firstValue);
    const second = Number(secondValue);
    const average = (Math.abs(first) + Math.abs(second)) / 2;

    if (!Number.isFinite(first) || !Number.isFinite(second)) {
        return Number.POSITIVE_INFINITY;
    }

    return average === 0
        ? 0
        : Math.abs(first - second) / average * 100;
};

const getTradeNotional = (trade) => {
    const storedValue = Number(trade.tradeValue);

    if (Number.isFinite(storedValue) && storedValue > 0) {
        return storedValue;
    }

    return Number(trade.quantity || 0) * Number(trade.price || 0);
};

const evaluateHighFrequencyVelocity = async (trade, recentTrades, rule, result) => {
    const maxTrades = rule.parameters?.maxTrades || 5;
    const windowSeconds = rule.parameters?.windowSeconds || 60;

    const redisCount = await recordTradeVelocity(trade, windowSeconds);

    if (redisCount !== null) {
        if (redisCount >= maxTrades) {
            addTriggeredRule(
                result,
                rule,
                `Trader ${trade.traderId} made ${redisCount} trades within ${windowSeconds} seconds using Redis velocity window`
            );
        }

        return;
    }

    const tradeTime = getTradeTime(trade);
    const windowStart = getWindowStart(tradeTime, windowSeconds);

    const tradesInWindow = recentTrades.filter((recentTrade) => {
        const recentTradeTime = getTradeTime(recentTrade);

        return (
            recentTrade.traderId === trade.traderId &&
            recentTradeTime >= windowStart &&
            recentTradeTime <= tradeTime
        );
    });

    if (tradesInWindow.length >= maxTrades) {
        addTriggeredRule(
            result,
            rule,
            `Trader ${trade.traderId} made ${tradesInWindow.length} trades within ${windowSeconds} seconds using MongoDB fallback`
        );
    }
};

const evaluateWashTradeDetection = (trade, recentTrades, rule, result) => {
    const windowMinutes = Number(rule.parameters?.windowMinutes ?? 10);
    const quantityTolerancePercent = Number(
        rule.parameters?.quantityTolerancePercent ?? 10
    );
    const priceTolerancePercent = Number(
        rule.parameters?.priceTolerancePercent ?? 5
    );

    const tradeTime = getTradeTime(trade);
    const windowStart = new Date(tradeTime.getTime() - windowMinutes * 60 * 1000);

    const oppositeTradeType = trade.tradeType === "BUY" ? "SELL" : "BUY";

    const washTradeMatch = recentTrades
        .map((recentTrade) => {
            return {
                trade: recentTrade,
                quantityDifferencePercent: calculateDifferencePercent(
                    trade.quantity,
                    recentTrade.quantity
                ),
                priceDifferencePercent: calculateDifferencePercent(
                    trade.price,
                    recentTrade.price
                )
            };
        })
        .find((match) => {
            const recentTrade = match.trade;
            const recentTradeTime = getTradeTime(recentTrade);

            return (
                recentTrade.traderId === trade.traderId &&
                recentTrade.stockSymbol === trade.stockSymbol &&
                recentTrade.tradeType === oppositeTradeType &&
                recentTradeTime >= windowStart &&
                recentTradeTime <= tradeTime &&
                match.quantityDifferencePercent <= quantityTolerancePercent &&
                match.priceDifferencePercent <= priceTolerancePercent
            );
        });

    if (washTradeMatch) {
        addTriggeredRule(
            result,
            rule,
            `Possible wash trade: trader ${trade.traderId} matched ${trade.tradeType} with opposite ${oppositeTradeType} on ${trade.stockSymbol} within ${windowMinutes} minutes; quantity difference ${washTradeMatch.quantityDifferencePercent.toFixed(2)}% and price difference ${washTradeMatch.priceDifferencePercent.toFixed(2)}%`
        );
    }
};

const evaluateMomentumIgnition = async (trade, recentTrades, rule, result) => {
    const minSameSideTrades = Number(rule.parameters?.minSameSideTrades ?? 4);
    const windowSeconds = Number(rule.parameters?.windowSeconds ?? 60);
    const minTotalNotional = Number(rule.parameters?.minTotalNotional ?? 50000);
    const priceDirectionCheck = rule.parameters?.priceDirectionCheck === true;

    const redisCount = await recordSameSideMomentum(trade, windowSeconds);

    const tradeTime = getTradeTime(trade);
    const windowStart = getWindowStart(tradeTime, windowSeconds);

    const sameSideTrades = [trade, ...recentTrades]
        .filter((recentTrade, index, trades) => {
            if (index > 0 && recentTrade === trade) {
                return false;
            }

            if (recentTrade._id) {
                return trades.findIndex((candidate) => {
                    return candidate._id && String(candidate._id) === String(recentTrade._id);
                }) === index;
            }

            return true;
        })
        .filter((recentTrade) => {
            const recentTradeTime = getTradeTime(recentTrade);

            return (
                recentTrade.traderId === trade.traderId &&
                recentTrade.stockSymbol === trade.stockSymbol &&
                recentTrade.tradeType === trade.tradeType &&
                recentTradeTime >= windowStart &&
                recentTradeTime <= tradeTime
            );
        })
        .sort((firstTrade, secondTrade) => {
            return getTradeTime(firstTrade) - getTradeTime(secondTrade);
        });

    const sameSideTradeCount = Math.max(redisCount || 0, sameSideTrades.length);
    const totalNotional = sameSideTrades.reduce((total, recentTrade) => {
        return total + getTradeNotional(recentTrade);
    }, 0);
    const hasEnoughPriceData = sameSideTrades.length >= 2;
    const firstPrice = Number(sameSideTrades[0]?.price);
    const lastPrice = Number(sameSideTrades[sameSideTrades.length - 1]?.price);
    const priceDirectionMatches = !priceDirectionCheck || !hasEnoughPriceData || (
        trade.tradeType === "BUY"
            ? lastPrice > firstPrice
            : lastPrice < firstPrice
    );

    if (
        sameSideTradeCount >= minSameSideTrades &&
        totalNotional >= minTotalNotional &&
        priceDirectionMatches
    ) {
        const directionReason = priceDirectionCheck && hasEnoughPriceData
            ? ` with ${trade.tradeType === "BUY" ? "upward" : "downward"} price direction confirmed`
            : "";

        addTriggeredRule(
            result,
            rule,
            `Momentum ignition pattern: ${sameSideTradeCount} same-side ${trade.tradeType} trades on ${trade.stockSymbol} totaling ${totalNotional.toFixed(2)} notional within ${windowSeconds} seconds${directionReason}`
        );
    }
};

const evaluateOrderToTradeRatio = async (subject, rule, result) => {
    const maxCancelToFillRatio = Number(rule.parameters?.maxCancelToFillRatio ?? 10);
    const windowMinutes = Number(rule.parameters?.windowMinutes ?? 30);
    const minOrders = Number(rule.parameters?.minOrders ?? 10);
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - windowMinutes * 60 * 1000);

    const baseQuery = {
        traderId: subject.traderId,
        createdAt: {
            $gte: windowStart,
            $lte: windowEnd
        }
    };

    const [totalOrders, cancelledOrders, filledOrders] = await Promise.all([
        Order.countDocuments(baseQuery),
        Order.countDocuments({
            ...baseQuery,
            status: "CANCELLED"
        }),
        Order.countDocuments({
            ...baseQuery,
            status: {
                $in: ["FILLED", "PARTIALLY_FILLED"]
            }
        })
    ]);

    const cancelToFillRatio = cancelledOrders / Math.max(filledOrders, 1);
    const roundedCancelToFillRatio = Number(cancelToFillRatio.toFixed(2));

    result.orderToTradeRatio = {
        totalOrders,
        cancelledOrders,
        filledOrders,
        cancelToFillRatio: roundedCancelToFillRatio,
        windowMinutes,
        minOrders,
        maxCancelToFillRatio
    };

    if (totalOrders < minOrders || cancelToFillRatio <= maxCancelToFillRatio) {
        return;
    }

    addTriggeredRule(
        result,
        rule,
        `Trader ${subject.traderId} has cancel-to-fill ratio ${roundedCancelToFillRatio} in last ${windowMinutes} minutes`
    );
};

const evaluateAfterHoursRestrictedTrading = (trade, rule, result) => {
    const restrictedSymbols = (rule.parameters?.restrictedSymbols || [])
        .map((restrictedSymbol) => String(restrictedSymbol).toUpperCase());
    const marketOpenHour = Number(rule.parameters?.marketOpenHour ?? 9);
    const marketCloseHour = Number(rule.parameters?.marketCloseHour ?? 16);
    const blockRestrictedSymbols = rule.parameters?.blockRestrictedSymbols === true;
    const afterHoursAction = rule.parameters?.afterHoursAction || "ALERT";

    const symbol = trade.stockSymbol?.toUpperCase();
    const tradeTime = getTradeTime(trade);
    const tradeHour = tradeTime.getHours();

    if (restrictedSymbols.includes(symbol)) {
        addTriggeredRule(
            result,
            rule,
            `Restricted symbol trading detected for ${symbol}. Configured action is ${blockRestrictedSymbols ? "BLOCK" : "ALERT"}; behavioral evaluation recorded an alert`
        );

        return;
    }

    if (tradeHour < marketOpenHour || tradeHour >= marketCloseHour) {
        addTriggeredRule(
            result,
            rule,
            `After-hours trade detected at hour ${tradeHour}. Allowed window is ${marketOpenHour}:00 to ${marketCloseHour}:00; configured action is ${afterHoursAction}`
        );
    }
};

const evaluateBehavioralRules = async (trade, recentTrades = []) => {
    const behavioralRules = await getRulesByTier("BEHAVIORAL");
    const ruleMap = buildRuleMap(behavioralRules);

    const cppConfig = {
        maxTrades: ruleMap.R6_HIGH_FREQUENCY_VELOCITY?.parameters?.maxTrades || 5,
        velocityWindowSeconds: ruleMap.R6_HIGH_FREQUENCY_VELOCITY?.parameters?.windowSeconds || 60,
        washWindowMinutes: ruleMap.R7_WASH_TRADE_DETECTION?.parameters?.windowMinutes || 10,
        minSameSideTrades: ruleMap.R8_MOMENTUM_IGNITION?.parameters?.minSameSideTrades || 4,
        momentumWindowSeconds: ruleMap.R8_MOMENTUM_IGNITION?.parameters?.windowSeconds || 60
    };

    const cppResult = await runCppRiskEngine(trade, recentTrades, cppConfig);

    if (cppResult) {
        const result = buildResultFromCpp(
            cppResult,
            ruleMap,
            ["R7_WASH_TRADE_DETECTION", "R8_MOMENTUM_IGNITION"]
        );

        if (ruleMap.R7_WASH_TRADE_DETECTION) {
            evaluateWashTradeDetection(
                trade,
                recentTrades,
                ruleMap.R7_WASH_TRADE_DETECTION,
                result
            );
        }

        if (ruleMap.R8_MOMENTUM_IGNITION) {
            await evaluateMomentumIgnition(
                trade,
                recentTrades,
                ruleMap.R8_MOMENTUM_IGNITION,
                result
            );
        }

        if (ruleMap.R10_AFTER_HOURS_RESTRICTED_TRADING) {
            evaluateAfterHoursRestrictedTrading(
                trade,
                ruleMap.R10_AFTER_HOURS_RESTRICTED_TRADING,
                result
            );
        }

        if (ruleMap.R9_ORDER_TO_TRADE_RATIO) {
            await evaluateOrderToTradeRatio(
                trade,
                ruleMap.R9_ORDER_TO_TRADE_RATIO,
                result
            );
        }

        return finalizeRiskResult(result);
    }

    const result = buildEmptyRiskResult("JAVASCRIPT_FALLBACK");

    if (ruleMap.R6_HIGH_FREQUENCY_VELOCITY) {
        await evaluateHighFrequencyVelocity(
            trade,
            recentTrades,
            ruleMap.R6_HIGH_FREQUENCY_VELOCITY,
            result
        );
    }

    if (ruleMap.R7_WASH_TRADE_DETECTION) {
        evaluateWashTradeDetection(
            trade,
            recentTrades,
            ruleMap.R7_WASH_TRADE_DETECTION,
            result
        );
    }

    if (ruleMap.R8_MOMENTUM_IGNITION) {
        await evaluateMomentumIgnition(
            trade,
            recentTrades,
            ruleMap.R8_MOMENTUM_IGNITION,
            result
        );
    }

    if (ruleMap.R9_ORDER_TO_TRADE_RATIO) {
        await evaluateOrderToTradeRatio(
            trade,
            ruleMap.R9_ORDER_TO_TRADE_RATIO,
            result
        );
    }

    if (ruleMap.R10_AFTER_HOURS_RESTRICTED_TRADING) {
        evaluateAfterHoursRestrictedTrading(
            trade,
            ruleMap.R10_AFTER_HOURS_RESTRICTED_TRADING,
            result
        );
    }

    return finalizeRiskResult(result);
};

const evaluateOrderLifecycleRisk = async (order) => {
    const behavioralRules = await getRulesByTier("BEHAVIORAL");
    const ruleMap = buildRuleMap(behavioralRules);
    const result = buildEmptyRiskResult("ORDER_LIFECYCLE");

    if (ruleMap.R9_ORDER_TO_TRADE_RATIO) {
        await evaluateOrderToTradeRatio(
            order,
            ruleMap.R9_ORDER_TO_TRADE_RATIO,
            result
        );
    }

    return finalizeRiskResult(result);
};

module.exports = {
    evaluateBehavioralRules,
    evaluateOrderLifecycleRisk
};
