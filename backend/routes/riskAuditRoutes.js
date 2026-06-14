const express = require("express");

const {
    getRiskAuditResults,
    runRiskAudit
} = require("../controllers/riskAuditController");
const { restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/run", restrictTo("ADMIN"), runRiskAudit);
router.get("/results", restrictTo("ADMIN"), getRiskAuditResults);

module.exports = router;
