const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actor: {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            name: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            role: {
                type: String,
                enum: ["ADMIN", "ANALYST"],
                required: true
            }
        },

        action: {
            type: String,
            enum: [
                "RISK_RULE_UPDATED",
                "ALERT_STATUS_UPDATED",
                "ALERT_ASSIGNED",
                "ALERT_COMMENT_ADDED",
                "ALERT_PRIORITY_UPDATED",
                "USER_ROLE_UPDATED",
                "CSV_TRADES_UPLOADED",
                "ORDER_CREATED",
                "ORDER_CANCELLED",
                "ORDER_FILLED"
            ],
            required: true
        },

        target: {
            entityType: {
                type: String,
                enum: ["RISK_RULE", "ALERT", "USER", "CSV_UPLOAD", "ORDER"],
                required: true
            },
            entityId: {
                type: String,
                default: ""
            },
            label: {
                type: String,
                default: ""
            }
        },

        changes: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        request: {
            ipAddress: {
                type: String,
                default: ""
            },
            userAgent: {
                type: String,
                default: ""
            }
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ "actor.userId": 1, createdAt: -1 });
auditLogSchema.index({ "target.entityType": 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
