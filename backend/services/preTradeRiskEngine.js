const Trade = require("../models/Trade");
const { getRulesByTier, buildRuleMap } = require("./dynamicRiskEngine");
const {
    checkAndStoreDuplicateTrade
} = require("./redisRiskWindow");

const defaultMarketPrices = {
    RELIANCE: 2800,
    TCS: 3500,
    INFY: 1500,
    PAYTM: 450,
    YESBANK: 25,
    HDFCBANK: 1650,
    ICICIBANK: 1100
};

const getTradeValue = (tradeData) => {
    return Number(tradeData.quantity) * Number(tradeData.price);
};

const getStartAndEndOfDay = (dateValue) => {
    const date = dateValue ? new Date(dateValue) : new Date();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return {
        startOfDay,
        endOfDay
    };
};

const addFailedRule = (failedRules, rule, reason) => {
    failedRules.push({
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        tier: rule.tier,
        severity: rule.severity,
        riskWeight: rule.riskWeight,
        action: rule.action,
        reason
    });
};
const evaluateSingleOrderValueCap = (tradeData, rule, failedRules) => {
    const tradeValue = getTradeValue(tradeData);
    const maxOrderValue = rule.parameters?.maxOrderValue || 1000000;

    if (tradeValue > maxOrderValue) {
        addFailedRule(
            failedRules,
            rule,
            `Trade value ${tradeValue} exceeds max single order value ${maxOrderValue}`
        );
    }
};

const evaluatePriceCollarCheck = (tradeData, rule, failedRules) => {
    const symbol = tradeData.stockSymbol?.toUpperCase();
    const orderPrice = Number(tradeData.price);

    const maxDeviationPercent = rule.parameters?.maxDeviationPercent || 10;
    const marketPrices = rule.parameters?.marketPrices || defaultMarketPrices;

    const lastMarketPrice = marketPrices[symbol];

    if (!lastMarketPrice) {
        return;
    }

    const deviationPercent =
        (Math.abs(orderPrice - lastMarketPrice) / lastMarketPrice) * 100;

    if (deviationPercent > maxDeviationPercent) {
        addFailedRule(
            failedRules,
            rule,
            `Order price ${orderPrice} deviates ${deviationPercent.toFixed(2)}% from market price ${lastMarketPrice}`
        );
    }
};

const evaluateDailyNotionalLimit = async (tradeData, rule, failedRules) => {
    const tradeValue = getTradeValue(tradeData);
    const maxDailyNotional = rule.parameters?.maxDailyNotional || 5000000;

    const { startOfDay, endOfDay } = getStartAndEndOfDay(tradeData.tradeTime);

    const tradesToday = await Trade.find({
        traderId: tradeData.traderId,
        tradeTime: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    });

    const existingDailyNotional = tradesToday.reduce((sum, trade) => {
        return sum + Number(trade.tradeValue || trade.quantity * trade.price);
    }, 0);

    const newDailyNotional = existingDailyNotional + tradeValue;

    if (newDailyNotional > maxDailyNotional) {
        addFailedRule(
            failedRules,
            rule,
            `Daily notional ${newDailyNotional} exceeds allowed limit ${maxDailyNotional}`
        );
    }
};

const evaluateDuplicateOrderDetection = async (tradeData, rule, failedRules) => {
    const duplicateWindowSeconds =
        rule.parameters?.duplicateWindowSeconds || 5;

    const redisDuplicate = await checkAndStoreDuplicateTrade(
        tradeData,
        duplicateWindowSeconds
    );

    if (redisDuplicate === true) {
        addFailedRule(
            failedRules,
            rule,
            `Duplicate trade detected within ${duplicateWindowSeconds} seconds using Redis real-time window`
        );

        return;
    }

    if (redisDuplicate === false) {
        return;
    }

    const tradeTime = tradeData.tradeTime
        ? new Date(tradeData.tradeTime)
        : new Date();

    const windowStart = new Date(
        tradeTime.getTime() - duplicateWindowSeconds * 1000
    );

    const duplicateTrade = await Trade.findOne({
        traderId: tradeData.traderId,
        stockSymbol: tradeData.stockSymbol,
        tradeType: tradeData.tradeType,
        quantity: Number(tradeData.quantity),
        price: Number(tradeData.price),
        tradeTime: {
            $gte: windowStart,
            $lte: tradeTime
        }
    });

    if (duplicateTrade) {
        addFailedRule(
            failedRules,
            rule,
            `Duplicate trade detected within ${duplicateWindowSeconds} seconds using MongoDB fallback`
        );
    }
};

const evaluateSingleOrderQuantityCap = (tradeData, rule, failedRules) => {
    const quantity = Number(tradeData.quantity);
    const maxQuantity = rule.parameters?.maxQuantity || 5000;

    if (quantity > maxQuantity) {
        addFailedRule(
            failedRules,
            rule,
            `Quantity ${quantity} exceeds max allowed quantity ${maxQuantity}`
        );
    }
};

const evaluatePreTradeRules = async (tradeData) => {
    const preTradeRules = await getRulesByTier("PRE_TRADE");
    const ruleMap = buildRuleMap(preTradeRules);

    const failedRules = [];

    if (ruleMap.R1_SINGLE_ORDER_VALUE_CAP) {
        evaluateSingleOrderValueCap(
            tradeData,
            ruleMap.R1_SINGLE_ORDER_VALUE_CAP,
            failedRules
        );
    }

    if (ruleMap.R2_PRICE_COLLAR_CHECK) {
        evaluatePriceCollarCheck(
            tradeData,
            ruleMap.R2_PRICE_COLLAR_CHECK,
            failedRules
        );
    }

    if (ruleMap.R3_DAILY_NOTIONAL_LIMIT) {
        await evaluateDailyNotionalLimit(
            tradeData,
            ruleMap.R3_DAILY_NOTIONAL_LIMIT,
            failedRules
        );
    }

    if (ruleMap.R5_SINGLE_ORDER_QUANTITY_CAP) {
        evaluateSingleOrderQuantityCap(
            tradeData,
            ruleMap.R5_SINGLE_ORDER_QUANTITY_CAP,
            failedRules
        );
    }

    if (
        failedRules.length === 0 &&
        ruleMap.R4_DUPLICATE_ORDER_DETECTION
    ) {
        await evaluateDuplicateOrderDetection(
            tradeData,
            ruleMap.R4_DUPLICATE_ORDER_DETECTION,
            failedRules
        );
    }

    return {
        blocked: failedRules.length > 0,
        failedRules
    };
};

module.exports = {
    evaluatePreTradeRules
};