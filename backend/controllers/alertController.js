const mongoose = require("mongoose");
const Alert = require("../models/Alert");

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const buildAlertQuery = (query) => {
    const {
        severity,
        status,
        traderId,
        stockSymbol,
        alertType,
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
        const alertQuery = buildAlertQuery(req.query);

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const allowSortingFields = ["createdAt", "riskScore", "severity", "status"];
        const sortBy = allowSortingFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

        const [alerts, totalAlerts] = await Promise.all([
            Alert.find(alertQuery)
                .populate("tradeId")
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
        res.status(500).json({
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

        const alert = await Alert.findById(id).populate("tradeId");
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

        alert.status = status;

        if(reviewComment) alert.reviewComment = reviewComment;
        if(reviewedBy) alert.reviewedBy = reviewedBy;

        alert.reviewedAt = new Date();
        
        await alert.save();

        res.status(200).json({
            message: "Alert status updated successfully",
            data: alert
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to update alert status",
            error: error.message
        });
    }
};

module.exports = {
    getAlerts,
    getAlertById,
    updateAlertStatus
};