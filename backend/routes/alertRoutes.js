const express = require("express");

const {
    getAlerts,
    getAlertById,
    updateAlertStatus,
    assignAlert,
    addAlertComment,
    updateAlertPriority,
    getAssignedAlerts
} = require("../controllers/alertController");
const { restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAlerts);
router.get("/assigned/me", getAssignedAlerts);
router.get("/:id", getAlertById);
router.put("/:id/status", updateAlertStatus);
router.put("/:id/assign", restrictTo("ADMIN"), assignAlert);
router.post("/:id/comments", addAlertComment);
router.put("/:id/priority", restrictTo("ADMIN"), updateAlertPriority);

module.exports = router;
