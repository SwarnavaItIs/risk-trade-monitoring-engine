const express = require("express");
const {
    getMembers,
    updateMemberRole,
    deleteMember
} = require("../controllers/adminController");

const {
    protect,
    restrictTo
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(restrictTo("ADMIN"));

router.get("/members", getMembers);
router.patch("/members/:id/role", updateMemberRole);
router.delete("/members/:id", deleteMember);

module.exports = router;