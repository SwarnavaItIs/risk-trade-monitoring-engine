const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
    try {
        const {
            action,
            actorRole,
            entityType,
            actorId,
            startDate,
            endDate
        } = req.query;

        const query = {};

        if (action) {
            query.action = action.toUpperCase().trim();
        }

        if (actorRole) {
            query["actor.role"] = actorRole.toUpperCase().trim();
        }

        if (entityType) {
            query["target.entityType"] = entityType.toUpperCase().trim();
        }

        if (actorId) {
            query["actor.userId"] = actorId;
        }

        if (startDate || endDate) {
            query.createdAt = {};

            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            AuditLog.countDocuments(query)
        ]);

        res.status(200).json({
            message: "Audit logs fetched successfully",
            count: logs.length,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            data: logs
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch audit logs",
            error: error.message
        });
    }
};

module.exports = {
    getAuditLogs
};
