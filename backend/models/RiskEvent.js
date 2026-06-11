const mongoose = require("mongoose");

const riskEventSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            enum: ["BLOCKED_TRADE", "ALERT_TRIGGERED", "AUDIT_TRIGGERED"],
            required: true
        },

        ruleCode: {
            type: String,
            required: true
        },

        ruleName: {
            type: String,
            required: true
        },

        tier: {
            type: String,
            enum: ["PRE_TRADE", "BEHAVIORAL", "POST_TRADE"],
            required: true
        },

        action: {
            type: String,
            enum: ["BLOCK", "ALERT", "AUDIT"],
            required: true
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "MEDIUM"
        },

        riskWeight: {
            type: Number,
            default: 0
        },

        traderId: {
            type: String,
            required: true
        },

        traderName: {
            type: String,
            required: true
        },

        stockSymbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        tradeType: {
            type: String,
            enum: ["BUY", "SELL"],
            required: true
        },

        quantity: {
            type: Number,
            required: true
        },

        price: {
            type: Number,
            required: true
        },

        tradeValue: {
            type: Number,
            required: true
        },

        tradeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trade",
            default: null
        },

        alertId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Alert",
            default: null
        },

        reason: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RiskEvent", riskEventSchema);