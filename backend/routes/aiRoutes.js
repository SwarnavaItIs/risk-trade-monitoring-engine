const express = require("express");

const {
    getAIHealth,
    testAIService,
    explainAlert,
    generateInvestigationSummary,
    generateDailyRiskReport,
    askRiskAssistant,
    generateRuleTuningSuggestions
} = require("../controllers/aiController");

const router = express.Router();

router.get("/health", getAIHealth);
router.post("/test", testAIService);
router.post("/alerts/:alertId/explain", explainAlert);
router.post(
    "/alerts/:alertId/investigation-summary",
    generateInvestigationSummary
);
router.post("/reports/daily-risk", generateDailyRiskReport);
router.post("/risk-assistant/query", askRiskAssistant);
router.post("/risk-rules/suggestions", generateRuleTuningSuggestions);

module.exports = router;