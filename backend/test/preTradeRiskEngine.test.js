const test = require("node:test");
const assert = require("node:assert/strict");

const Trade = require("../models/Trade");
const RiskRule = require("../models/RiskRules");
const { evaluatePreTradeRules } = require("../services/preTradeRiskEngine");

const buildRule = (ruleCode, parameters = {}) => {
    return {
        ruleCode,
        ruleName: ruleCode,
        tier: "PRE_TRADE",
        severity: "HIGH",
        riskWeight: 35,
        action: "BLOCK",
        parameters
    };
};

const preserveModels = (context) => {
    const originalRuleFind = RiskRule.find;
    const originalTradeFind = Trade.find;
    const originalTradeFindOne = Trade.findOne;

    context.after(() => {
        RiskRule.find = originalRuleFind;
        Trade.find = originalTradeFind;
        Trade.findOne = originalTradeFindOne;
    });
};

const useRules = (rules) => {
    RiskRule.find = () => ({
        sort: async () => rules
    });
};

const baseTrade = {
    traderId: "T1001",
    traderName: "Test Trader",
    stockSymbol: "INFY",
    tradeType: "BUY",
    quantity: 10,
    price: 1500,
    tradeTime: new Date()
};

test("R2 blocks abnormal static-fallback prices and includes the source", async (context) => {
    preserveModels(context);
    useRules([
        buildRule("R2_PRICE_COLLAR_CHECK", {
            maxDeviationPercent: 10
        })
    ]);

    const result = await evaluatePreTradeRules({
        ...baseTrade,
        price: 2500
    });

    assert.equal(result.blocked, true);
    assert.equal(result.failedRules[0].ruleCode, "R2_PRICE_COLLAR_CHECK");
    assert.match(result.failedRules[0].reason, /66\.67%/);
    assert.match(result.failedRules[0].reason, /\(STATIC_FALLBACK\)/);
});

test("R2 passes a normal market price", async (context) => {
    preserveModels(context);
    useRules([
        buildRule("R2_PRICE_COLLAR_CHECK", {
            maxDeviationPercent: 10
        })
    ]);

    const result = await evaluatePreTradeRules(baseTrade);

    assert.equal(result.blocked, false);
    assert.deepEqual(result.failedRules, []);
});

test("R1, R3, R4, and R5 continue to evaluate", async (context) => {
    preserveModels(context);
    useRules([
        buildRule("R1_SINGLE_ORDER_VALUE_CAP", {
            maxOrderValue: 1000
        }),
        buildRule("R3_DAILY_NOTIONAL_LIMIT", {
            maxDailyNotional: 1000
        }),
        buildRule("R4_DUPLICATE_ORDER_DETECTION", {
            duplicateWindowSeconds: 5
        }),
        buildRule("R5_SINGLE_ORDER_QUANTITY_CAP", {
            maxQuantity: 5
        })
    ]);
    Trade.find = async () => [];
    Trade.findOne = async () => ({
        _id: "507f1f77bcf86cd799439011"
    });

    const result = await evaluatePreTradeRules(baseTrade);
    const ruleCodes = result.failedRules.map((rule) => rule.ruleCode);

    assert.equal(result.blocked, true);
    assert.ok(ruleCodes.includes("R1_SINGLE_ORDER_VALUE_CAP"));
    assert.ok(ruleCodes.includes("R3_DAILY_NOTIONAL_LIMIT"));
    assert.ok(ruleCodes.includes("R5_SINGLE_ORDER_QUANTITY_CAP"));
});

test("R4 duplicate detection still blocks when other rules pass", async (context) => {
    preserveModels(context);
    useRules([
        buildRule("R4_DUPLICATE_ORDER_DETECTION", {
            duplicateWindowSeconds: 5
        })
    ]);
    Trade.findOne = async () => ({
        _id: "507f1f77bcf86cd799439011"
    });

    const result = await evaluatePreTradeRules(baseTrade);

    assert.equal(result.blocked, true);
    assert.equal(result.failedRules[0].ruleCode, "R4_DUPLICATE_ORDER_DETECTION");
});
