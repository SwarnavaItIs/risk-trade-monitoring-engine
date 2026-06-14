const RiskEvent = require("../models/RiskEvent");

const getTradeValue = (tradeData) => {
    return Number(tradeData.quantity) * Number(tradeData.price);
};

const logBlockedTradeEvents = async (tradeData, failedRules) => {
    const events = failedRules.map((rule) => ({
        eventType: "BLOCKED_TRADE",
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        tier: "PRE_TRADE",
        action: rule.action || "BLOCK",
        severity: rule.severity || "HIGH",
        riskWeight: rule.riskWeight || 0,

        traderId: tradeData.traderId,
        traderName: tradeData.traderName,
        stockSymbol: tradeData.stockSymbol,
        tradeType: tradeData.tradeType,
        quantity: Number(tradeData.quantity),
        price: Number(tradeData.price),
        tradeValue: getTradeValue(tradeData),

        tradeId: null,
        alertId: null,
        reason: rule.reason
    }));

    if (events.length > 0) {
        await RiskEvent.insertMany(events);
    }
};

const logAlertRuleEvents = async ({ trade, alert, riskResult }) => {
    const events = riskResult.ruleDetails.map((rule) => ({
        eventType: "ALERT_TRIGGERED",
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        tier: "BEHAVIORAL",
        action: rule.action || "ALERT",
        severity: rule.severity || riskResult.severity,
        riskWeight: rule.riskWeight || 0,

        traderId: trade.traderId,
        traderName: trade.traderName,
        stockSymbol: trade.stockSymbol,
        tradeType: trade.tradeType,
        quantity: Number(trade.quantity),
        price: Number(trade.price),
        tradeValue: Number(trade.tradeValue || trade.quantity * trade.price),

        tradeId: trade._id,
        alertId: alert._id,
        reason: rule.reason
    }));

    if (events.length > 0) {
        await RiskEvent.insertMany(events);
    }
};

const logOrderAlertRuleEvents = async ({ order, alert, riskResult }) => {
    const events = riskResult.ruleDetails.map((rule) => ({
        eventType: "ALERT_TRIGGERED",
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        tier: "BEHAVIORAL",
        action: rule.action || "ALERT",
        severity: rule.severity || riskResult.severity,
        riskWeight: rule.riskWeight || 0,

        traderId: order.traderId,
        traderName: order.traderName,
        stockSymbol: order.stockSymbol,
        tradeType: order.side,
        quantity: Number(order.quantity),
        price: Number(order.price),
        tradeValue: Number(order.orderValue || order.quantity * order.price),

        tradeId: null,
        orderId: order._id,
        alertId: alert._id,
        reason: rule.reason
    }));

    if (events.length > 0) {
        await RiskEvent.insertMany(events);
    }
};

module.exports = {
    logBlockedTradeEvents,
    logAlertRuleEvents,
    logOrderAlertRuleEvents
};
