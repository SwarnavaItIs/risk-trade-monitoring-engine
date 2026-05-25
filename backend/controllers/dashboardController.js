const getDashboardSummary = (req, res) => {
    res.status(200).json({
        totalTrades: 0,
        totalAlerts: 0,
        highRiskAlerts: 0,
        pendingAlerts: 0,
        reviewedAlerts: 0,
        escalatedAlerts: 0
    });
};

const getAlertsBySeverity = (req, res) => {
    res.status(200).json({
        data: [
            { severity: "LOW", count: 0 },
            { severity: "MEDIUM", count: 0 },
            { severity: "HIGH", count: 0 }
        ]
    });
};

const getAlertsByType = (req, res) => {
    res.status(200).json({
        data: []
    });
};

const getTopRiskyTraders = (req, res) => {
    res.status(200).json({
        data: []
    });
};

module.exports = {
    getDashboardSummary,
    getAlertsBySeverity,
    getAlertsByType,
    getTopRiskyTraders
};