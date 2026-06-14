const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

const RiskRule = require("../models/RiskRules");
const RiskEvent = require("../models/RiskEvent");
const Trade = require("../models/Trade");
const riskAuditRoutes = require("../routes/riskAuditRoutes");
const {
    buildBurnRateEvents,
    buildConcentrationEvents
} = require("../services/postTradeAuditService");

const r11Rule = {
    ruleCode: "R11_CUMULATIVE_PORTFOLIO_CONCENTRATION",
    ruleName: "Cumulative Portfolio Concentration",
    severity: "MEDIUM",
    riskWeight: 30,
    action: "AUDIT",
    parameters: {
        maxSymbolConcentrationPercent: 70
    }
};

const r12Rule = {
    ruleCode: "R12_AGGREGATE_CAPITAL_BURN_RATE",
    ruleName: "Aggregate Capital Burn Rate",
    severity: "HIGH",
    riskWeight: 40,
    action: "AUDIT",
    parameters: {
        hourlyBurnThresholdPercent: 60
    }
};

const dailyTotals = [
    {
        _id: {
            traderId: "T1001",
            traderName: "Test Trader",
            stockSymbol: "TCS"
        },
        totalNotional: 80000
    },
    {
        _id: {
            traderId: "T1001",
            traderName: "Test Trader",
            stockSymbol: "INFY"
        },
        totalNotional: 20000
    }
];

test("R11 detects daily symbol concentration", () => {
    const events = buildConcentrationEvents(dailyTotals, r11Rule);

    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, "AUDIT_TRIGGERED");
    assert.equal(events[0].ruleCode, r11Rule.ruleCode);
    assert.equal(events[0].stockSymbol, "TCS");
    assert.match(events[0].reason, /80.00%/);
});

test("R12 detects a high last-hour burn rate", () => {
    const events = buildBurnRateEvents([
        {
            _id: {
                traderId: "T1001",
                traderName: "Test Trader"
            },
            hourlyNotional: 70000
        }
    ], dailyTotals, r12Rule);

    assert.equal(events.length, 1);
    assert.equal(events[0].ruleCode, r12Rule.ruleCode);
    assert.equal(events[0].tradeValue, 70000);
    assert.match(events[0].reason, /70.00%/);
});

test("audit events validate without trade-specific fields", async () => {
    const event = new RiskEvent({
        eventType: "AUDIT_TRIGGERED",
        ruleCode: r12Rule.ruleCode,
        ruleName: r12Rule.ruleName,
        tier: "POST_TRADE",
        action: "AUDIT",
        tradeValue: 0,
        reason: "Audit test"
    });

    await event.validate();

    assert.equal(event.tradeType, null);
    assert.equal(event.tradeValue, 0);
});

test("non-audit risk events still require trade details", async () => {
    const event = new RiskEvent({
        eventType: "ALERT_TRIGGERED",
        ruleCode: "R7_WASH_TRADE_DETECTION",
        ruleName: "Wash Trade Detection",
        tier: "BEHAVIORAL",
        action: "ALERT",
        tradeValue: 1000,
        reason: "Missing trade details"
    });

    await assert.rejects(event.validate(), /traderId|tradeType|quantity|price/);
});

test("risk audit endpoints run for admins and reject analysts", async (context) => {
    const originalFind = RiskRule.find;
    const originalAggregate = Trade.aggregate;
    const originalInsertMany = RiskEvent.insertMany;
    const originalRiskEventFind = RiskEvent.find;
    let insertedEvents = [];

    context.after(() => {
        RiskRule.find = originalFind;
        Trade.aggregate = originalAggregate;
        RiskEvent.insertMany = originalInsertMany;
        RiskEvent.find = originalRiskEventFind;
    });

    RiskRule.find = () => ({
        sort: async () => [r11Rule, r12Rule]
    });
    Trade.aggregate = async (pipeline) => {
        return pipeline[1].$group._id.stockSymbol
            ? dailyTotals
            : [{
                _id: {
                    traderId: "T1001",
                    traderName: "Test Trader"
                },
                hourlyNotional: 70000
            }];
    };
    RiskEvent.insertMany = async (events) => {
        insertedEvents = events.map((event, index) => ({
            _id: `audit-${index}`,
            createdAt: new Date(),
            ...event
        }));
        return insertedEvents;
    };
    RiskEvent.find = () => ({
        sort: () => ({
            limit: async () => insertedEvents
        })
    });

    const app = express();
    app.use(express.json());
    app.use("/api/risk-audit", (req, res, next) => {
        req.user = {
            role: req.headers["x-test-role"] || "ANALYST"
        };
        next();
    }, riskAuditRoutes);

    const server = app.listen(0);
    context.after(() => server.close());
    const { port } = server.address();

    const rejectedResponse = await fetch(`http://127.0.0.1:${port}/api/risk-audit/run`, {
        method: "POST",
        headers: {
            "x-test-role": "ANALYST"
        }
    });
    const runResponse = await fetch(`http://127.0.0.1:${port}/api/risk-audit/run`, {
        method: "POST",
        headers: {
            "x-test-role": "ADMIN"
        }
    });
    const runBody = await runResponse.json();
    const resultsResponse = await fetch(`http://127.0.0.1:${port}/api/risk-audit/results`, {
        headers: {
            "x-test-role": "ADMIN"
        }
    });
    const resultsBody = await resultsResponse.json();

    assert.equal(rejectedResponse.status, 403);
    assert.equal(runResponse.status, 200);
    assert.equal(runBody.message, "Risk audit completed successfully");
    assert.equal(runBody.data.length, 2);
    assert.equal(resultsResponse.status, 200);
    assert.equal(resultsBody.data.length, 2);
});
