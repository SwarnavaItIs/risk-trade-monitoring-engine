const test = require("node:test");
const assert = require("node:assert/strict");

const RiskRule = require("../models/RiskRules");
const { evaluateBehavioralRules } = require("../services/behavioralRiskEngine");

const createRule = (ruleCode, parameters = {}) => {
    return {
        ruleCode,
        ruleName: ruleCode,
        tier: "BEHAVIORAL",
        severity: "HIGH",
        riskWeight: 40,
        action: "ALERT",
        parameters
    };
};

const useRules = (context, rules) => {
    const originalFind = RiskRule.find;

    context.after(() => {
        RiskRule.find = originalFind;
    });

    RiskRule.find = () => ({
        sort: async () => rules
    });
};

test("R7 triggers only for similar opposite-side trades", async (context) => {
    useRules(context, [
        createRule("R7_WASH_TRADE_DETECTION", {
            windowMinutes: 10,
            quantityTolerancePercent: 10,
            priceTolerancePercent: 5
        })
    ]);

    const now = new Date();
    const trade = {
        _id: "current-r7",
        traderId: "T1001",
        stockSymbol: "TCS",
        tradeType: "BUY",
        quantity: 100,
        price: 100,
        tradeTime: now
    };
    const similarOppositeTrade = {
        _id: "similar-r7",
        traderId: "T1001",
        stockSymbol: "TCS",
        tradeType: "SELL",
        quantity: 105,
        price: 102,
        tradeTime: new Date(now.getTime() - 60 * 1000)
    };
    const dissimilarOppositeTrade = {
        ...similarOppositeTrade,
        _id: "dissimilar-r7",
        quantity: 200,
        price: 150
    };

    const matchingResult = await evaluateBehavioralRules(
        trade,
        [similarOppositeTrade]
    );
    const dissimilarResult = await evaluateBehavioralRules(
        trade,
        [dissimilarOppositeTrade]
    );

    assert.deepEqual(matchingResult.triggeredRules, ["R7_WASH_TRADE_DETECTION"]);
    assert.match(matchingResult.reasons[0], /opposite SELL on TCS within 10 minutes/);
    assert.match(matchingResult.reasons[0], /quantity difference .* price difference/);
    assert.deepEqual(dissimilarResult.triggeredRules, []);
});

test("R8 requires minimum notional and explains the total", async (context) => {
    useRules(context, [
        createRule("R8_MOMENTUM_IGNITION", {
            minSameSideTrades: 4,
            windowSeconds: 60,
            minTotalNotional: 50000,
            priceDirectionCheck: true
        })
    ]);

    const now = new Date();
    const buildTrade = (id, secondsAgo, price) => ({
        _id: id,
        traderId: "T2001",
        stockSymbol: "INFY",
        tradeType: "BUY",
        quantity: 200,
        price,
        tradeTime: new Date(now.getTime() - secondsAgo * 1000)
    });
    const trade = buildTrade("current-r8", 0, 103);
    const recentTrades = [
        buildTrade("r8-1", 45, 100),
        buildTrade("r8-2", 30, 101),
        buildTrade("r8-3", 15, 102)
    ];

    const result = await evaluateBehavioralRules(trade, recentTrades);
    const lowNotionalResult = await evaluateBehavioralRules(
        {
            ...trade,
            _id: "current-r8-low",
            quantity: 10
        },
        recentTrades.map((recentTrade, index) => ({
            ...recentTrade,
            _id: `r8-low-${index}`,
            quantity: 10
        }))
    );

    assert.deepEqual(result.triggeredRules, ["R8_MOMENTUM_IGNITION"]);
    assert.match(result.reasons[0], /4 same-side BUY trades/);
    assert.match(result.reasons[0], /totaling 81200.00 notional within 60 seconds/);
    assert.match(result.reasons[0], /upward price direction confirmed/);
    assert.deepEqual(lowNotionalResult.triggeredRules, []);
});

test("R10 restricted symbol configuration remains alert-only", async (context) => {
    useRules(context, [
        createRule("R10_AFTER_HOURS_RESTRICTED_TRADING", {
            restrictedSymbols: ["PAYTM"],
            marketOpenHour: 9,
            marketCloseHour: 16,
            blockRestrictedSymbols: true,
            afterHoursAction: "ALERT"
        })
    ]);

    const tradeTime = new Date();
    tradeTime.setHours(12, 0, 0, 0);

    const result = await evaluateBehavioralRules({
        traderId: "T3001",
        stockSymbol: "PAYTM",
        tradeType: "BUY",
        quantity: 10,
        price: 450,
        tradeTime
    }, []);

    assert.deepEqual(result.triggeredRules, ["R10_AFTER_HOURS_RESTRICTED_TRADING"]);
    assert.equal(result.ruleDetails[0].action, "ALERT");
    assert.match(result.reasons[0], /Configured action is BLOCK; behavioral evaluation recorded an alert/);
});
