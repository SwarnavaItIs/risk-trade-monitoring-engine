const express = require("express");

const {
    getAlerts,
    getAlertById,
    updateAlertStatus
} = require("../controllers/alertController");

const router = express.Router();

router.get("/", getAlerts);
router.get("/:id", getAlertById);
router.put("/:id/status", updateAlertStatus);

module.exports = router;