const mongoose = require("mongoose");

const requiredForTradeEvent = function () {
    return this.eventType !== "AUDIT_TRIGGERED";
};

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
            default: "",
            required: requiredForTradeEvent
        },

        traderName: {
            type: String,
            default: "",
            required: requiredForTradeEvent
        },

        stockSymbol: {
            type: String,
            default: "",
            required: requiredForTradeEvent,
            uppercase: true,
            trim: true
        },

        tradeType: {
            type: String,
            enum: ["BUY", "SELL"],
            default: null,
            required: requiredForTradeEvent
        },

        quantity: {
            type: Number,
            required: requiredForTradeEvent
        },

        price: {
            type: Number,
            required: requiredForTradeEvent
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

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
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
