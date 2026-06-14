const RiskEvent = require("../models/RiskEvent");
const { runPostTradeAudit } = require("../services/postTradeAuditService");

const runRiskAudit = async (req, res) => {
    try {
        const results = await runPostTradeAudit();

        res.status(200).json({
            message: "Risk audit completed successfully",
            data: results
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to run risk audit",
            error: error.message
        });
    }
};

const getRiskAuditResults = async (req, res) => {
    try {
        const query = {
            eventType: "AUDIT_TRIGGERED"
        };

        ["ruleCode", "traderId", "stockSymbol"].forEach((filter) => {
            if (req.query[filter]) {
                query[filter] = filter === "stockSymbol"
                    ? req.query[filter].toUpperCase()
                    : req.query[filter];
            }
        });

        const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
        const results = await RiskEvent.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            message: "Risk audit results fetched successfully",
            data: results
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch risk audit results",
            error: error.message
        });
    }
};

module.exports = {
    getRiskAuditResults,
    runRiskAudit
};
