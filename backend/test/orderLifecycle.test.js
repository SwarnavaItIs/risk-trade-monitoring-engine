const test = require("node:test");
const assert = require("node:assert/strict");

const Order = require("../models/Order");
const RiskRule = require("../models/RiskRules");
const RiskEvent = require("../models/RiskEvent");
const { logOrderAlertRuleEvents } = require("../services/riskEventLogger");
const {
    evaluateBehavioralRules,
    evaluateOrderLifecycleRisk
} = require("../services/behavioralRiskEngine");

const r9Rule = {
    ruleCode: "R9_ORDER_TO_TRADE_RATIO",
    ruleName: "Order-to-Trade Ratio",
    tier: "BEHAVIORAL",
    severity: "MEDIUM",
    riskWeight: 25,
    action: "ALERT",
    parameters: {
        maxCancelToFillRatio: 10,
        windowMinutes: 30,
        minOrders: 10
    }
};

test("order model normalizes lifecycle data", async () => {
    const order = new Order({
        orderId: "ORDER-1",
        traderId: "T1001",
        traderName: "Test Trader",
        stockSymbol: "tcs",
        side: "BUY",
        quantity: 10,
        price: 100
    });

    await order.validate();

    assert.equal(order.stockSymbol, "TCS");
    assert.equal(order.status, "SUBMITTED");
    assert.equal(order.filledQuantity, 0);
});

test("R9 triggers when cancellations exceed fills after minimum order count", async (context) => {
    const originalFind = RiskRule.find;
    const originalCountDocuments = Order.countDocuments;
    let countCall = 0;

    context.after(() => {
        RiskRule.find = originalFind;
        Order.countDocuments = originalCountDocuments;
    });

    RiskRule.find = () => ({
        sort: async () => [r9Rule]
    });

    Order.countDocuments = async () => {
        countCall++;
        return [13, 12, 1][countCall - 1];
    };

    const result = await evaluateOrderLifecycleRisk({
        traderId: "T1001"
    });

    assert.equal(result.isRisky, true);
    assert.deepEqual(result.triggeredRules, ["R9_ORDER_TO_TRADE_RATIO"]);
    assert.equal(result.orderToTradeRatio.cancelToFillRatio, 12);
    assert.match(result.reasons[0], /cancel-to-fill ratio 12/);
});

test("R9 does not trigger before minimum order count", async (context) => {
    const originalFind = RiskRule.find;
    const originalCountDocuments = Order.countDocuments;
    let countCall = 0;

    context.after(() => {
        RiskRule.find = originalFind;
        Order.countDocuments = originalCountDocuments;
    });

    RiskRule.find = () => ({
        sort: async () => [r9Rule]
    });

    Order.countDocuments = async () => {
        countCall++;
        return [9, 9, 0][countCall - 1];
    };

    const result = await evaluateOrderLifecycleRisk({
        traderId: "T1001"
    });

    assert.equal(result.isRisky, false);
    assert.deepEqual(result.triggeredRules, []);
});

test("normal trade behavioral evaluation also includes R9", async (context) => {
    const originalFind = RiskRule.find;
    const originalCountDocuments = Order.countDocuments;
    let countCall = 0;

    context.after(() => {
        RiskRule.find = originalFind;
        Order.countDocuments = originalCountDocuments;
    });

    RiskRule.find = () => ({
        sort: async () => [r9Rule]
    });

    Order.countDocuments = async () => {
        countCall++;
        return [13, 12, 1][countCall - 1];
    };

    const result = await evaluateBehavioralRules({
        traderId: "T1001",
        traderName: "Test Trader",
        stockSymbol: "TCS",
        tradeType: "BUY",
        quantity: 1,
        price: 100,
        tradeTime: new Date()
    }, []);

    assert.equal(result.isRisky, true);
    assert.deepEqual(result.triggeredRules, ["R9_ORDER_TO_TRADE_RATIO"]);
});

test("R9 order alerts are logged as RiskEvents with an order reference", async (context) => {
    const originalInsertMany = RiskEvent.insertMany;
    let insertedEvents;

    context.after(() => {
        RiskEvent.insertMany = originalInsertMany;
    });

    RiskEvent.insertMany = async (events) => {
        insertedEvents = events;
        return events;
    };

    await logOrderAlertRuleEvents({
        order: {
            _id: "507f1f77bcf86cd799439013",
            traderId: "T1001",
            traderName: "Test Trader",
            stockSymbol: "TCS",
            side: "BUY",
            quantity: 10,
            price: 100,
            orderValue: 1000
        },
        alert: {
            _id: "507f1f77bcf86cd799439014"
        },
        riskResult: {
            severity: "LOW",
            ruleDetails: [
                {
                    ...r9Rule,
                    reason: "R9 test reason"
                }
            ]
        }
    });

    assert.equal(insertedEvents.length, 1);
    assert.equal(insertedEvents[0].ruleCode, "R9_ORDER_TO_TRADE_RATIO");
    assert.equal(insertedEvents[0].orderId, "507f1f77bcf86cd799439013");
    assert.equal(insertedEvents[0].tradeId, null);
});
