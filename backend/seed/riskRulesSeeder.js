require("dotenv").config();

const mongoose = require("mongoose");
const RiskRule = require("../models/RiskRules");

const defaultRiskRules = [
    {
        ruleCode: "R1_SINGLE_ORDER_VALUE_CAP",
        ruleName: "Single Order Value Cap",
        description: "Blocks trades where price multiplied by quantity exceeds the maximum allowed single order value.",
        tier: "PRE_TRADE",
        category: "ORDER_VALUE",
        enabled: true,
        severity: "HIGH",
        riskWeight: 40,
        action: "BLOCK",
        parameters: {
            maxOrderValue: 1000000
        }
    },
    {
        ruleCode: "R2_PRICE_COLLAR_CHECK",
        ruleName: "Price Collar Check",
        description: "Blocks trades where order price deviates too far from the last known market price.",
        tier: "PRE_TRADE",
        category: "PRICE_DEVIATION",
        enabled: true,
        severity: "HIGH",
        riskWeight: 35,
        action: "BLOCK",
        parameters: {
            maxDeviationPercent: 10
        }
    },
    {
        ruleCode: "R3_DAILY_NOTIONAL_LIMIT",
        ruleName: "Daily Notional Limit",
        description: "Blocks trades if a trader's total traded value for the day exceeds the configured daily limit.",
        tier: "PRE_TRADE",
        category: "DAILY_LIMIT",
        enabled: true,
        severity: "HIGH",
        riskWeight: 45,
        action: "BLOCK",
        parameters: {
            maxDailyNotional: 5000000
        }
    },
    {
        ruleCode: "R4_DUPLICATE_ORDER_DETECTION",
        ruleName: "Duplicate Order Detection",
        description: "Blocks duplicate trades with same trader, symbol, side, quantity, and price within a short time window.",
        tier: "PRE_TRADE",
        category: "DUPLICATE_ORDER",
        enabled: true,
        severity: "MEDIUM",
        riskWeight: 30,
        action: "BLOCK",
        parameters: {
            duplicateWindowSeconds: 5
        }
    },
    {
        ruleCode: "R5_SINGLE_ORDER_QUANTITY_CAP",
        ruleName: "Single Order Quantity Cap",
        description: "Blocks trades where quantity exceeds the maximum allowed quantity per order.",
        tier: "PRE_TRADE",
        category: "ORDER_SIZE",
        enabled: true,
        severity: "HIGH",
        riskWeight: 35,
        action: "BLOCK",
        parameters: {
            maxQuantity: 5000
        }
    },
    {
        ruleCode: "R6_HIGH_FREQUENCY_VELOCITY",
        ruleName: "High-Frequency Velocity",
        description: "Flags traders who submit too many trades inside a rolling time window.",
        tier: "BEHAVIORAL",
        category: "VELOCITY",
        enabled: true,
        severity: "MEDIUM",
        riskWeight: 30,
        action: "ALERT",
        parameters: {
            maxTrades: 5,
            windowSeconds: 60
        }
    },
    {
        ruleCode: "R7_WASH_TRADE_DETECTION",
        ruleName: "Wash Trade Detection",
        description: "Flags cases where the same trader buys and sells the same symbol within a short time window.",
        tier: "BEHAVIORAL",
        category: "WASH_TRADE",
        enabled: true,
        severity: "HIGH",
        riskWeight: 45,
        action: "ALERT",
        parameters: {
            windowMinutes: 10
        }
    },
    {
        ruleCode: "R8_MOMENTUM_IGNITION",
        ruleName: "Momentum Ignition",
        description: "Flags rapid sequences of same-side trades for the same symbol by the same trader.",
        tier: "BEHAVIORAL",
        category: "MOMENTUM_IGNITION",
        enabled: true,
        severity: "HIGH",
        riskWeight: 40,
        action: "ALERT",
        parameters: {
            minSameSideTrades: 4,
            windowSeconds: 60
        }
    },
    {
        ruleCode: "R9_ORDER_TO_TRADE_RATIO",
        ruleName: "Order-to-Trade Ratio",
        description: "Flags cases where order cancellations significantly exceed executed trades. Placeholder until order lifecycle is implemented.",
        tier: "BEHAVIORAL",
        category: "ORDER_TO_TRADE_RATIO",
        enabled: false,
        severity: "MEDIUM",
        riskWeight: 25,
        action: "ALERT",
        parameters: {
            maxCancelToFillRatio: 10
        }
    },
    {
        ruleCode: "R10_AFTER_HOURS_RESTRICTED_TRADING",
        ruleName: "After-Hours / Restricted Symbol Trading",
        description: "Flags or blocks trades placed during restricted trading windows or in restricted symbols.",
        tier: "BEHAVIORAL",
        category: "RESTRICTED_TRADING",
        enabled: true,
        severity: "HIGH",
        riskWeight: 35,
        action: "ALERT",
        parameters: {
            restrictedSymbols: ["PAYTM", "YESBANK"],
            marketOpenHour: 9,
            marketCloseHour: 16
        }
    },
    {
        ruleCode: "R11_CUMULATIVE_PORTFOLIO_CONCENTRATION",
        ruleName: "Cumulative Portfolio Concentration",
        description: "Audits whether a trader's daily notional is overly concentrated in a single symbol.",
        tier: "POST_TRADE",
        category: "CONCENTRATION",
        enabled: true,
        severity: "MEDIUM",
        riskWeight: 30,
        action: "AUDIT",
        parameters: {
            maxSymbolConcentrationPercent: 70
        }
    },
    {
        ruleCode: "R12_AGGREGATE_CAPITAL_BURN_RATE",
        ruleName: "Aggregate Capital Burn Rate",
        description: "Audits whether capital usage crosses a configured hourly burn threshold.",
        tier: "POST_TRADE",
        category: "CAPITAL_BURN",
        enabled: true,
        severity: "HIGH",
        riskWeight: 40,
        action: "AUDIT",
        parameters: {
            hourlyBurnThresholdPercent: 60
        }
    }
];

const seedRiskRules = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        for (const rule of defaultRiskRules) {
            await RiskRule.findOneAndUpdate(
                { ruleCode: rule.ruleCode },
                rule,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        }

        console.log("Risk rules seeded successfully");
        process.exit(0);
    }
    catch (error) {
        console.error("Failed to seed risk rules:", error.message);
        process.exit(1);
    }
};

seedRiskRules();