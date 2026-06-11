const express = require("express");

const {
    getDashboardSummary,
    getAlertsBySeverity,
    getAlertsByType,
    getTopRiskyTraders,
    getTopTradedStocks,
    getRiskTrend,
    getRuleTriggerSummary,
    getBlockedTradeSummary,
    getRecentRiskEvents
} = require("../controllers/dashboardController");
const router = express.Router();

router.get("/summary", getDashboardSummary);
router.get("/alerts-by-severity", getAlertsBySeverity);
router.get("/alerts-by-type", getAlertsByType);
router.get("/top-risky-traders", getTopRiskyTraders);
router.get("/top-traded-stocks", getTopTradedStocks);
router.get("/risk-trend", getRiskTrend);
router.get("/rule-trigger-summary", getRuleTriggerSummary);
router.get("/blocked-trade-summary", getBlockedTradeSummary);
router.get("/recent-risk-events", getRecentRiskEvents);

module.exports = router;