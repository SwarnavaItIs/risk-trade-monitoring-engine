const express = require("express");

const {
    getAIHealth,
    testAIService,
    explainAlert,
    generateInvestigationSummary
} = require("../controllers/aiController");

const router = express.Router();

router.get("/health", getAIHealth);
router.post("/test", testAIService);
router.post("/alerts/:alertId/explain", explainAlert);
router.post(
    "/alerts/:alertId/investigation-summary",
    generateInvestigationSummary
);

module.exports = router;