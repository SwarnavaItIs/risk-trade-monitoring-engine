const mongoose = require("mongoose");

const riskRuleSchema = new mongoose.Schema(
    {
        ruleCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        ruleName: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        tier: {
            type: String,
            enum: ["PRE_TRADE", "BEHAVIORAL", "POST_TRADE"],
            required: true
        },

        category: {
            type: String,
            required: true
        },

        enabled: {
            type: Boolean,
            default: true
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

        action: {
            type: String,
            enum: ["BLOCK", "ALERT", "AUDIT"],
            required: true
        },

        parameters: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("RiskRule", riskRuleSchema);