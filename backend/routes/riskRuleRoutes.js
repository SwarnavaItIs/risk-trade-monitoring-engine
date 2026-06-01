const express = require("express");

const {
    getRiskRules,
    getRiskRuleById,
    updateRiskRule
} = require("../controllers/riskRuleController");

const { restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getRiskRules);
router.get("/:id", getRiskRuleById);
router.put("/:id", restrictTo("ADMIN"), updateRiskRule);

module.exports = router;