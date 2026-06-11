const Trade = require("../models/Trade");
const Alert = require("../models/Alert");
const RiskEvent = require("../models/RiskEvent");

const getDashboardSummary = async (req, res) => {
    try {
        const [
            totalTrades,
            totalAlerts,
            highRiskAlerts,
            mediumRiskAlerts,
            lowRiskAlerts,
            pendingAlerts,
            underReviewAlerts,
            escalatedAlerts,
            resolvedAlerts,
            falsePositiveAlerts,
            totalTradeValueResult,
            averageRiskScoreResult
        ] = await Promise.all([
            Trade.countDocuments(),
            Alert.countDocuments(),
            Alert.countDocuments({ severity: "HIGH" }),
            Alert.countDocuments({ severity: "MEDIUM" }),
            Alert.countDocuments({ severity: "LOW" }),
            Alert.countDocuments({ status: "PENDING" }),
            Alert.countDocuments({ status: "UNDER_REVIEW" }),
            Alert.countDocuments({ status: "ESCALATED" }),
            Alert.countDocuments({ status: "RESOLVED" }),
            Alert.countDocuments({ status: "FALSE_POSITIVE" }),

            Trade.aggregate([
                {
                    $group: {
                        _id: null,
                        totalTradeValue: { $sum: "$tradeValue" }
                    }
                }
            ]),

            Alert.aggregate([
                {
                    $group: {
                        _id: null,
                        averageRiskScore: { $avg: "$riskScore" }
                    }
                }
            ])
        ]);

        const totalTradeValue =
            totalTradeValueResult.length > 0
                ? totalTradeValueResult[0].totalTradeValue
                : 0;

        const averageRiskScore =
            averageRiskScoreResult.length > 0
                ? Number(averageRiskScoreResult[0].averageRiskScore.toFixed(2))
                : 0;

        res.status(200).json({
            message: "Dashboard summary fetched successfully",
            data: {
                totalTrades,
                totalAlerts,
                totalTradeValue,
                averageRiskScore,

                alertsBySeverity: {
                    high: highRiskAlerts,
                    medium: mediumRiskAlerts,
                    low: lowRiskAlerts
                },

                alertsByStatus: {
                    pending: pendingAlerts,
                    underReview: underReviewAlerts,
                    escalated: escalatedAlerts,
                    resolved: resolvedAlerts,
                    falsePositive: falsePositiveAlerts
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard summary",
            error: error.message
        });
    }
};

const getAlertsBySeverity = async (req, res) => {
    try {
        const result = await Alert.aggregate([
            {
                $group: {
                    _id: "$severity",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);

        const severityMap = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0
        };

        result.forEach((item) => {
            severityMap[item._id] = item.count;
        });

        const data = [
            { severity: "LOW", count: severityMap.LOW },
            { severity: "MEDIUM", count: severityMap.MEDIUM },
            { severity: "HIGH", count: severityMap.HIGH }
        ];

        res.status(200).json({
            message: "Alerts by severity fetched successfully",
            data
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch alerts by severity",
            error: error.message
        });
    }
};

const getAlertsByType = async (req, res) => {
    try {
        const data = await Alert.aggregate([
            {
                $group: {
                    _id: "$alertType",
                    count: { $sum: 1 },
                    averageRiskScore: { $avg: "$riskScore" }
                }
            },
            {
                $project: {
                    _id: 0,
                    alertType: "$_id",
                    count: 1,
                    averageRiskScore: { $round: ["$averageRiskScore", 2] }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);

        res.status(200).json({
            message: "Alerts by type fetched successfully",
            data
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch alerts by type",
            error: error.message
        });
    }
};

const getTopRiskyTraders = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 20);

        const data = await Alert.aggregate([
            {
                $group: {
                    _id: "$traderId",
                    traderName: { $first: "$traderName" },
                    totalAlerts: { $sum: 1 },
                    highRiskAlerts: {
                        $sum: {
                            $cond: [{ $eq: ["$severity", "HIGH"] }, 1, 0]
                        }
                    },
                    averageRiskScore: { $avg: "$riskScore" },
                    maxRiskScore: { $max: "$riskScore" }
                }
            },
            {
                $project: {
                    _id: 0,
                    traderId: "$_id",
                    traderName: 1,
                    totalAlerts: 1,
                    highRiskAlerts: 1,
                    averageRiskScore: { $round: ["$averageRiskScore", 2] },
                    maxRiskScore: 1
                }
            },
            {
                $sort: {
                    totalAlerts: -1,
                    averageRiskScore: -1
                }
            },
            {
                $limit: limit
            }
        ]);

        res.status(200).json({
            message: "Top risky traders fetched successfully",
            data
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch top risky traders",
            error: error.message
        });
    }
};

const getTopTradedStocks = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 5, 20);

        const data = await Trade.aggregate([
            {
                $group: {
                    _id: "$stockSymbol",
                    totalTrades: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    totalTradeValue: { $sum: "$tradeValue" },
                    averageTradeValue: { $avg: "$tradeValue" }
                }
            },
            {
                $project: {
                    _id: 0,
                    stockSymbol: "$_id",
                    totalTrades: 1,
                    totalQuantity: 1,
                    totalTradeValue: 1,
                    averageTradeValue: { $round: ["$averageTradeValue", 2] }
                }
            },
            {
                $sort: {
                    totalTradeValue: -1
                }
            },
            {
                $limit: limit
            }
        ]);

        res.status(200).json({
            message: "Top traded stocks fetched successfully",
            data
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch top traded stocks",
            error: error.message
        });
    }
};

const getRiskTrend = async (req, res) => {
    try {
        const data = await Alert.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalAlerts: { $sum: 1 },
                    highRiskAlerts: {
                        $sum: {
                            $cond: [{ $eq: ["$severity", "HIGH"] }, 1, 0]
                        }
                    },
                    averageRiskScore: { $avg: "$riskScore" }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.month", 10] },
                                    { $concat: ["0", { $toString: "$_id.month" }] },
                                    { $toString: "$_id.month" }
                                ]
                            },
                            "-",
                            {
                                $cond: [
                                    { $lt: ["$_id.day", 10] },
                                    { $concat: ["0", { $toString: "$_id.day" }] },
                                    { $toString: "$_id.day" }
                                ]
                            }
                        ]
                    },
                    totalAlerts: 1,
                    highRiskAlerts: 1,
                    averageRiskScore: { $round: ["$averageRiskScore", 2] }
                }
            },
            {
                $sort: {
                    date: 1
                }
            }
        ]);

        res.status(200).json({
            message: "Risk trend fetched successfully",
            data
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch risk trend",
            error: error.message
        });
    }
};

const getRuleTriggerSummary = async (req, res) => {
    try {
        const summary = await RiskEvent.aggregate([
            {
                $group: {
                    _id: {
                        ruleCode: "$ruleCode",
                        ruleName: "$ruleName",
                        eventType: "$eventType",
                        tier: "$tier",
                        action: "$action",
                        severity: "$severity"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    ruleCode: "$_id.ruleCode",
                    ruleName: "$_id.ruleName",
                    eventType: "$_id.eventType",
                    tier: "$_id.tier",
                    action: "$_id.action",
                    severity: "$_id.severity",
                    count: 1
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);

        res.status(200).json({
            message: "Rule trigger summary fetched successfully",
            data: summary
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch rule trigger summary",
            error: error.message
        });
    }
};

const getBlockedTradeSummary = async (req, res) => {
    try {
        const totalBlockedTrades = await RiskEvent.countDocuments({
            eventType: "BLOCKED_TRADE"
        });

        const blockedByRule = await RiskEvent.aggregate([
            {
                $match: {
                    eventType: "BLOCKED_TRADE"
                }
            },
            {
                $group: {
                    _id: {
                        ruleCode: "$ruleCode",
                        ruleName: "$ruleName"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    ruleCode: "$_id.ruleCode",
                    ruleName: "$_id.ruleName",
                    count: 1
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);

        res.status(200).json({
            message: "Blocked trade summary fetched successfully",
            data: {
                totalBlockedTrades,
                blockedByRule
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch blocked trade summary",
            error: error.message
        });
    }
};

const getRecentRiskEvents = async (req, res) => {
    try {
        const events = await RiskEvent.find()
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            message: "Recent risk events fetched successfully",
            data: events
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch recent risk events",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardSummary,
    getAlertsBySeverity,
    getAlertsByType,
    getTopRiskyTraders,
    getTopTradedStocks,
    getRiskTrend,
    getRuleTriggerSummary,
    getBlockedTradeSummary,
    getRecentRiskEvents
};