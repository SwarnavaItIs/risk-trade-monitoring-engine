const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
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

        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: function () {
                return ["LOW", "MEDIUM", "HIGH"].includes(this.severity)
                    ? this.severity
                    : "MEDIUM";
            }
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        assignedToName: {
            type: String,
            default: ""
        },

        assignedToEmail: {
            type: String,
            default: ""
        },

        reviewDeadline: {
            type: Date
        },

        commentHistory: {
            type: [
                {
                    comment: {
                        type: String,
                        required: true,
                        trim: true
                    },
                    commentedBy: {
                        type: String,
                        required: true
                    },
                    commentedByEmail: {
                        type: String,
                        required: true
                    },
                    commentedByRole: {
                        type: String,
                        required: true
                    },
                    createdAt: {
                        type: Date,
                        default: Date.now
                    }
                }
            ],
            default: []
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

alertSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
alertSchema.index({ priority: 1, createdAt: -1 });

alertSchema.pre("validate", function () {
    if (!this.tradeId && !this.orderId) {
        this.invalidate("tradeId", "Alert must reference a trade or an order");
    }
});

module.exports = mongoose.model("Alert", alertSchema);
