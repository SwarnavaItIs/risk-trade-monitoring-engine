const mongoose = require("mongoose");
const Alert = require("../models/Alert");

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate("tradeId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Alerts retrieved successfully",
            data: alerts
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
        const { status, reviewComment, reviewedBy } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid alert ID"
            });
        }

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