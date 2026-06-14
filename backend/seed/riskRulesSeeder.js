require("dotenv").config();

const mongoose = require("mongoose");
const RiskRule = require("../models/RiskRules");

const defaultRiskRules = [
    {
        ruleCode: "R1_SINGLE_ORDER_VALUE_CAP",
        ruleName: "Single Order Value Cap",
        description: "Blocks a trade when the total order value, calculated as price multiplied by quantity, exceeds the maximum allowed value for a single order. This prevents unusually large trades from entering the system accidentally or maliciously.",
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
        description: "Blocks a trade when the submitted order price is too far away from the latest reference market price. This helps catch fat-finger errors, incorrect prices, and abnormal orders before they are accepted.",
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
        description: "Blocks a trade if the trader's total traded value for the current day would exceed the configured daily notional limit. This controls excessive exposure and prevents a trader from consuming too much capital in one day.",
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
        description: "Blocks repeated orders with the same trader, symbol, side, quantity, and price submitted within a short time window. This helps prevent accidental double-submission and duplicate order spam.",
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
        description: "Blocks a trade when the quantity exceeds the maximum number of shares or units allowed in a single order. This protects the system from oversized orders that may create operational or market risk.",
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
        description: "Generates an alert when a trader submits too many trades within a short rolling time window. This may indicate automated trading bursts, order looping, or abnormal trading velocity.",
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
        description: "Generates an alert when the same trader buys and sells the same symbol within a short time window. This may indicate wash trading behavior where trades create artificial activity without real market intent.",
        tier: "BEHAVIORAL",
        category: "WASH_TRADE",
        enabled: true,
        severity: "HIGH",
        riskWeight: 45,
        action: "ALERT",
        parameters: {
            windowMinutes: 10,
            quantityTolerancePercent: 10,
            priceTolerancePercent: 5
        }
    },
    {
        ruleCode: "R8_MOMENTUM_IGNITION",
        ruleName: "Momentum Ignition",
        description: "Generates an alert when a trader submits a rapid sequence of same-side trades for the same symbol. This may indicate an attempt to create artificial momentum or influence short-term price movement.",
        tier: "BEHAVIORAL",
        category: "MOMENTUM_IGNITION",
        enabled: true,
        severity: "HIGH",
        riskWeight: 40,
        action: "ALERT",
        parameters: {
            minSameSideTrades: 4,
            windowSeconds: 60,
            minTotalNotional: 50000,
            priceDirectionCheck: false
        }
    },
    {
        ruleCode: "R9_ORDER_TO_TRADE_RATIO",
        ruleName: "Order-to-Trade Ratio",
        description: "Generates an alert when order cancellations are too high compared to filled trades within a configured time window. This can indicate quote stuffing, spoofing-like behavior, or poor order discipline. This rule requires order lifecycle tracking.",
        tier: "BEHAVIORAL",
        category: "ORDER_TO_TRADE_RATIO",
        enabled: true,
        severity: "MEDIUM",
        riskWeight: 25,
        action: "ALERT",
        parameters: {
            maxCancelToFillRatio: 10,
            windowMinutes: 30,
            minOrders: 10
        }
    },
    {
        ruleCode: "R10_AFTER_HOURS_RESTRICTED_TRADING",
        ruleName: "After-Hours / Restricted Symbol Trading",
        description: "Generates an alert when a trade occurs outside the configured market hours or involves a restricted symbol. This helps identify trades that may violate internal policies, trading windows, or restricted-list controls.",
        tier: "BEHAVIORAL",
        category: "RESTRICTED_TRADING",
        enabled: true,
        severity: "HIGH",
        riskWeight: 35,
        action: "ALERT",
        parameters: {
            restrictedSymbols: ["PAYTM", "YESBANK"],
            marketOpenHour: 9,
            marketCloseHour: 16,
            blockRestrictedSymbols: false,
            afterHoursAction: "ALERT"
        }
    },
    {
        ruleCode: "R11_CUMULATIVE_PORTFOLIO_CONCENTRATION",
        ruleName: "Cumulative Portfolio Concentration",
        description: "Runs as a post-trade audit rule to identify traders whose daily trading activity is overly concentrated in a single symbol. High concentration can create liquidity, exposure, and portfolio risk.",
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
        description: "Runs as a post-trade audit rule to detect unusually fast capital usage over a short period. This helps identify traders or activity patterns that consume risk limits too quickly.",
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
};

const runSeeder = async () => {
    try {
        await seedRiskRules();
        process.exit(0);
    }
    catch (error) {
        console.error("Failed to seed risk rules:", error.message);
        process.exit(1);
    }
};

if (require.main === module) {
    runSeeder();
}

module.exports = {
    defaultRiskRules,
    seedRiskRules
};
