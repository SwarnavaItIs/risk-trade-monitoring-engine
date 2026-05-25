const express = require("express");

const {
    getDashboardSummary,
    getAlertsBySeverity,
    getAlertsByType,
    getTopRiskyTraders
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/summary", getDashboardSummary);
router.get("/alerts-by-severity", getAlertsBySeverity);
router.get("/alerts-by-type", getAlertsByType);
router.get("/top-risky-traders", getTopRiskyTraders);

module.exports = router;