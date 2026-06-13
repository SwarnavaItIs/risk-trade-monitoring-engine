const { getRulesByTier, buildRuleMap } = require("./dynamicRiskEngine");
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

const buildResultFromCpp = (cppResult, ruleMap) => {
    const ruleDetails = (cppResult.ruleDetails || [])
        .filter((detail) => ruleMap[detail.ruleCode])
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
    const windowMinutes = rule.parameters?.windowMinutes || 10;

    const tradeTime = getTradeTime(trade);
    const windowStart = new Date(tradeTime.getTime() - windowMinutes * 60 * 1000);

    const oppositeTradeType = trade.tradeType === "BUY" ? "SELL" : "BUY";

    const washTrade = recentTrades.find((recentTrade) => {
        const recentTradeTime = getTradeTime(recentTrade);

        return (
            recentTrade.traderId === trade.traderId &&
            recentTrade.stockSymbol === trade.stockSymbol &&
            recentTrade.tradeType === oppositeTradeType &&
            recentTradeTime >= windowStart &&
            recentTradeTime <= tradeTime
        );
    });

    if (washTrade) {
        addTriggeredRule(
            result,
            rule,
            `Possible wash trade: trader ${trade.traderId} performed ${trade.tradeType} and ${oppositeTradeType} on ${trade.stockSymbol} within ${windowMinutes} minutes`
        );
    }
};

const evaluateMomentumIgnition = async (trade, recentTrades, rule, result) => {
    const minSameSideTrades = rule.parameters?.minSameSideTrades || 4;
    const windowSeconds = rule.parameters?.windowSeconds || 60;

    const redisCount = await recordSameSideMomentum(trade, windowSeconds);

    if (redisCount !== null) {
        if (redisCount >= minSameSideTrades) {
            addTriggeredRule(
                result,
                rule,
                `Momentum ignition pattern: ${redisCount} same-side ${trade.tradeType} trades on ${trade.stockSymbol} within ${windowSeconds} seconds using Redis momentum window`
            );
        }

        return;
    }

    const tradeTime = getTradeTime(trade);
    const windowStart = getWindowStart(tradeTime, windowSeconds);

    const sameSideTrades = recentTrades.filter((recentTrade) => {
        const recentTradeTime = getTradeTime(recentTrade);

        return (
            recentTrade.traderId === trade.traderId &&
            recentTrade.stockSymbol === trade.stockSymbol &&
            recentTrade.tradeType === trade.tradeType &&
            recentTradeTime >= windowStart &&
            recentTradeTime <= tradeTime
        );
    });

    if (sameSideTrades.length >= minSameSideTrades) {
        addTriggeredRule(
            result,
            rule,
            `Momentum ignition pattern: ${sameSideTrades.length} same-side ${trade.tradeType} trades on ${trade.stockSymbol} within ${windowSeconds} seconds using MongoDB fallback`
        );
    }
};

const evaluateOrderToTradeRatio = (trade, recentTrades, rule, result) => {
    // Placeholder rule.
    // Our current system stores executed trades only.
    // To implement this properly, we need an Order model with submitted/cancelled/filled states.
    return;
};

const evaluateAfterHoursRestrictedTrading = (trade, rule, result) => {
    const restrictedSymbols = rule.parameters?.restrictedSymbols || [];
    const marketOpenHour = rule.parameters?.marketOpenHour ?? 9;
    const marketCloseHour = rule.parameters?.marketCloseHour ?? 16;

    const symbol = trade.stockSymbol?.toUpperCase();
    const tradeTime = getTradeTime(trade);
    const tradeHour = tradeTime.getHours();

    if (restrictedSymbols.includes(symbol)) {
        addTriggeredRule(
            result,
            rule,
            `Restricted symbol trading detected for ${symbol}`
        );

        return;
    }

    if (tradeHour < marketOpenHour || tradeHour >= marketCloseHour) {
        addTriggeredRule(
            result,
            rule,
            `After-hours trade detected at hour ${tradeHour}. Allowed window is ${marketOpenHour}:00 to ${marketCloseHour}:00`
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
        const result = buildResultFromCpp(cppResult, ruleMap);

        if (ruleMap.R10_AFTER_HOURS_RESTRICTED_TRADING) {
            evaluateAfterHoursRestrictedTrading(
                trade,
                ruleMap.R10_AFTER_HOURS_RESTRICTED_TRADING,
                result
            );
        }

        result.riskScore = Math.min(result.riskScore, 100);
        result.severity = calculateSeverityFromScore(result.riskScore);
        result.isRisky = result.triggeredRules.length > 0;

        return result;
    }

    const result = {
        isRisky: false,
        riskScore: 0,
        severity: "LOW",
        triggeredRules: [],
        reasons: [],
        ruleDetails: [],
        evaluationEngine: "JAVASCRIPT_FALLBACK"
    };

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
        evaluateOrderToTradeRatio(
            trade,
            recentTrades,
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

    result.riskScore = Math.min(result.riskScore, 100);
    result.severity = calculateSeverityFromScore(result.riskScore);
    result.isRisky = result.triggeredRules.length > 0;

    return result;
};

module.exports = {
    evaluateBehavioralRules
};
