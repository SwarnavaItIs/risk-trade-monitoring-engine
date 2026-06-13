const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const User = require("../models/User");
const {
    buildChanges,
    createAuditLog
} = require("../services/auditLogService");

const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const getAlertAuditMetadata = (alert) => {
    return {
        alertId: alert._id.toString(),
        traderId: alert.traderId,
        stockSymbol: alert.stockSymbol,
        severity: alert.severity,
        assignedToName: alert.assignedToName || "",
        priority: alert.priority || alert.severity || "MEDIUM"
    };
};

const buildAlertQuery = (query, currentUser) => {
    const {
        severity,
        status,
        traderId,
        stockSymbol,
        alertType,
        assignedTo,
        priority,
        minRiskScore,
        maxRiskScore,
        startDate,
        endDate
    } = query;

    const alertQuery = {};

    if (severity) {
        alertQuery.severity = severity.toUpperCase().trim();
    }

    if (status) {
        alertQuery.status = status.toUpperCase().trim();
    }

    if (traderId) {
        alertQuery.traderId = traderId.trim();
    }

    if (stockSymbol) {
        alertQuery.stockSymbol = stockSymbol.toUpperCase().trim();
    }

    if (alertType) {
        alertQuery.alertType = alertType.toUpperCase().trim();
    }

    if (priority) {
        const normalizedPriority = String(priority).toUpperCase().trim();

        if (!allowedPriorities.includes(normalizedPriority)) {
            const error = new Error("Invalid priority value");
            error.statusCode = 400;
            throw error;
        }

        if (normalizedPriority === "CRITICAL") {
            alertQuery.priority = normalizedPriority;
        }
        else {
            alertQuery.$or = [
                { priority: normalizedPriority },
                {
                    priority: null,
                    severity: normalizedPriority
                }
            ];
        }
    }

    if (assignedTo) {
        const normalizedAssignedTo = assignedTo.toString().toLowerCase().trim();

        if (normalizedAssignedTo === "assigned") {
            alertQuery.assignedTo = { $ne: null };
        }
        else if (normalizedAssignedTo === "unassigned") {
            alertQuery.assignedTo = null;
        }
        else if (normalizedAssignedTo === "me") {
            alertQuery.assignedTo = currentUser._id;
        }
        else if (isValidObjectId(assignedTo)) {
            alertQuery.assignedTo = assignedTo;
        }
        else {
            const error = new Error("Invalid assignedTo value");
            error.statusCode = 400;
            throw error;
        }
    }

    if(minRiskScore || maxRiskScore) {
        alertQuery.riskScore = {};

        if(minRiskScore) {
            alertQuery.riskScore.$gte = parseInt(minRiskScore);
        }
        if(maxRiskScore) {
            alertQuery.riskScore.$lte = parseInt(maxRiskScore);
        }
    }

    if (startDate || endDate) {
        alertQuery.createdAt = {};

        if (startDate) {
            alertQuery.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            alertQuery.createdAt.$lte = new Date(endDate);
        }
    }

    return alertQuery;
};

const getAlerts = async (req, res) => {
    try {
        const alertQuery = buildAlertQuery(req.query, req.user);

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const allowSortingFields = ["createdAt", "riskScore", "severity", "status", "priority"];
        const sortBy = allowSortingFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

        const [alerts, totalAlerts] = await Promise.all([
            Alert.find(alertQuery)
                .populate("tradeId")
                .populate("assignedTo", "name email role status")
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit),
            Alert.countDocuments(alertQuery)
        ]);

        res.status(200).json({
            message: "Alerts retrieved successfully",
            count: alerts.length,
            total: totalAlerts,
            currentPage: page,
            totalPages: Math.ceil(totalAlerts / limit),
            data: alerts,
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            message: "Failed to retrieve alerts",
            error: error.message
        });
    }
};

const getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid alert ID"
            });
        }

        const alert = await Alert.findById(id)
            .populate("tradeId")
            .populate("assignedTo", "name email role status");
        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        res.status(200).json({
            message: "Alert retrieved successfully",
            data: alert
        });
    }

    catch (error) {
        res.status(500).json({
            message: "Failed to retrieve alert",
            error: error.message
        });
    }
};

const updateAlertStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let { status, reviewComment, reviewedBy } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid alert ID"
            });
        }

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        status = status.toUpperCase().trim();

        const allowedStatuses = [
            "PENDING",
            "UNDER_REVIEW",
            "ESCALATED",
            "RESOLVED",
            "FALSE_POSITIVE"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status value"
            });
        }

        const alert = await Alert.findById(id);

        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        const previousAlert = alert.toObject();

        alert.status = status;

        if(reviewComment) alert.reviewComment = reviewComment;
        if(reviewedBy) alert.reviewedBy = reviewedBy;

        alert.reviewedAt = new Date();
        
        await alert.save();

        const changes = buildChanges(
            previousAlert,
            alert,
            ["status", "reviewComment", "reviewedBy"]
        );

        if (Object.keys(changes).length > 0) {
            await createAuditLog({
                req,
                action: "ALERT_STATUS_UPDATED",
                target: {
                    entityType: "ALERT",
                    entityId: alert._id.toString(),
                    label: `${alert.alertType} - ${alert.traderId}`
                },
                changes,
                metadata: {
                    stockSymbol: alert.stockSymbol,
                    severity: alert.severity
                }
            });
        }

        const updatedAlert = await Alert.findById(id)
            .populate("tradeId")
            .populate("assignedTo", "name email role status");

        res.status(200).json({
            message: "Alert status updated successfully",
            data: updatedAlert
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to update alert status",
            error: error.message
        });
    }
};

const assignAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo, priority, reviewDeadline } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid alert ID"
            });
        }

        if (assignedTo === undefined) {
            return res.status(400).json({
                message: "assignedTo is required"
            });
        }

        let assignedUser = null;

        if (assignedTo) {
            if (!isValidObjectId(assignedTo)) {
                return res.status(400).json({
                    message: "Invalid assigned user ID"
                });
            }

            assignedUser = await User.findById(assignedTo)
                .select("name email role status");

            if (!assignedUser) {
                return res.status(404).json({
                    message: "Assigned user not found"
                });
            }

            if (!["ANALYST", "ADMIN"].includes(assignedUser.role)) {
                return res.status(400).json({
                    message: "Alerts can only be assigned to analysts or admins"
                });
            }

            if (assignedUser.status === "SUSPENDED") {
                return res.status(400).json({
                    message: "Alerts cannot be assigned to suspended users"
                });
            }
        }

        let normalizedPriority;

        if (priority !== undefined) {
            normalizedPriority = String(priority).toUpperCase().trim();

            if (!allowedPriorities.includes(normalizedPriority)) {
                return res.status(400).json({
                    message: "Invalid priority value"
                });
            }
        }

        let parsedReviewDeadline;

        if (reviewDeadline !== undefined && reviewDeadline !== null && reviewDeadline !== "") {
            parsedReviewDeadline = new Date(reviewDeadline);

            if (Number.isNaN(parsedReviewDeadline.getTime())) {
                return res.status(400).json({
                    message: "Invalid review deadline"
                });
            }
        }

        const alert = await Alert.findById(id);

        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        const previousAlert = alert.toObject();

        alert.assignedTo = assignedUser?._id || null;
        alert.assignedToName = assignedUser?.name || "";
        alert.assignedToEmail = assignedUser?.email || "";

        if (normalizedPriority) {
            alert.priority = normalizedPriority;
        }

        if (reviewDeadline !== undefined) {
            alert.reviewDeadline = parsedReviewDeadline || null;
        }

        await alert.save();

        const assignmentChanges = buildChanges(
            previousAlert,
            alert,
            [
                "assignedTo",
                "assignedToName",
                "assignedToEmail",
                "reviewDeadline"
            ]
        );

        if (Object.keys(assignmentChanges).length > 0) {
            await createAuditLog({
                req,
                action: "ALERT_ASSIGNED",
                target: {
                    entityType: "ALERT",
                    entityId: alert._id.toString(),
                    label: `${alert.alertType} - ${alert.traderId}`
                },
                changes: assignmentChanges,
                metadata: getAlertAuditMetadata(alert)
            });
        }

        const priorityChanges = buildChanges(previousAlert, alert, ["priority"]);

        if (Object.keys(priorityChanges).length > 0) {
            await createAuditLog({
                req,
                action: "ALERT_PRIORITY_UPDATED",
                target: {
                    entityType: "ALERT",
                    entityId: alert._id.toString(),
                    label: `${alert.alertType} - ${alert.traderId}`
                },
                changes: priorityChanges,
                metadata: getAlertAuditMetadata(alert)
            });
        }

        const updatedAlert = await Alert.findById(id)
            .populate("tradeId")
            .populate("assignedTo", "name email role status");

        res.status(200).json({
            message: assignedUser
                ? "Alert assigned successfully"
                : "Alert unassigned successfully",
            data: updatedAlert
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to assign alert",
            error: error.message
        });
    }
};

const addAlertComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = req.body.comment?.trim();

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid alert ID"
            });
        }

        if (!comment) {
            return res.status(400).json({
                message: "Comment is required"
            });
        }

        const alert = await Alert.findById(id);

        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        const historyEntry = {
            comment,
            commentedBy: req.user.name,
            commentedByEmail: req.user.email,
            commentedByRole: req.user.role
        };

        alert.commentHistory.push(historyEntry);
        alert.reviewComment = comment;
        alert.reviewedBy = req.user.name;
        alert.reviewedAt = new Date();

        await alert.save();

        const savedHistoryEntry =
            alert.commentHistory[alert.commentHistory.length - 1].toObject();

        await createAuditLog({
            req,
            action: "ALERT_COMMENT_ADDED",
            target: {
                entityType: "ALERT",
                entityId: alert._id.toString(),
                label: `${alert.alertType} - ${alert.traderId}`
            },
            changes: {
                commentHistory: {
                    added: savedHistoryEntry
                }
            },
            metadata: getAlertAuditMetadata(alert)
        });

        const updatedAlert = await Alert.findById(id)
            .populate("tradeId")
            .populate("assignedTo", "name email role status");

        res.status(200).json({
            message: "Alert comment added successfully",
            data: updatedAlert
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to add alert comment",
            error: error.message
        });
    }
};

const updateAlertPriority = async (req, res) => {
    try {
        const { id } = req.params;
        const priority = req.body.priority === undefined
            ? undefined
            : String(req.body.priority).toUpperCase().trim();

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid alert ID"
            });
        }

        if (!allowedPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority value"
            });
        }

        const alert = await Alert.findById(id);

        if (!alert) {
            return res.status(404).json({
                message: "Alert not found"
            });
        }

        const previousAlert = alert.toObject();

        alert.priority = priority;
        await alert.save();

        const changes = buildChanges(previousAlert, alert, ["priority"]);

        if (Object.keys(changes).length > 0) {
            await createAuditLog({
                req,
                action: "ALERT_PRIORITY_UPDATED",
                target: {
                    entityType: "ALERT",
                    entityId: alert._id.toString(),
                    label: `${alert.alertType} - ${alert.traderId}`
                },
                changes,
                metadata: getAlertAuditMetadata(alert)
            });
        }

        const updatedAlert = await Alert.findById(id)
            .populate("tradeId")
            .populate("assignedTo", "name email role status");

        res.status(200).json({
            message: "Alert priority updated successfully",
            data: updatedAlert
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to update alert priority",
            error: error.message
        });
    }
};

const getAssignedAlerts = async (req, res) => {
    try {
        const alertQuery = buildAlertQuery(
            {
                ...req.query,
                assignedTo: "me"
            },
            req.user
        );

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const [alerts, totalAlerts] = await Promise.all([
            Alert.find(alertQuery)
                .populate("tradeId")
                .populate("assignedTo", "name email role status")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Alert.countDocuments(alertQuery)
        ]);

        res.status(200).json({
            message: "Assigned alerts retrieved successfully",
            count: alerts.length,
            total: totalAlerts,
            currentPage: page,
            totalPages: Math.ceil(totalAlerts / limit),
            data: alerts
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            message: "Failed to retrieve assigned alerts",
            error: error.message
        });
    }
};

module.exports = {
    getAlerts,
    getAlertById,
    updateAlertStatus,
    assignAlert,
    addAlertComment,
    updateAlertPriority,
    getAssignedAlerts
};
