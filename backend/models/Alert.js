const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        tradeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Trade",
            required: true
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
            uppercase: true
        },

        alertType: {
            type: String,
            required: true
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            required: true
        },

        riskScore: {
            type: Number,
            default: 0
        },

        triggeredRules: {
            type: [String],
            default: []
        },

        reasons: {
            type: [String],
            default: []
        },

        message: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["PENDING", "UNDER_REVIEW", "ESCALATED", "RESOLVED", "FALSE_POSITIVE"],
            default: "PENDING"
        },

        reviewComment: {
            type: String,
            default: ""
        },

        reviewedBy: {
            type: String,
            default: ""
        },

        reviewedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Alert", alertSchema);