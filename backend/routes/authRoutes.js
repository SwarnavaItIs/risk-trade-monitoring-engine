const express = require("express");

const {
    getMe,
    registerUser,
    loginUser,
    gooleLoginUser
} = require("../controllers/authController");

const {protect} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMe);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", gooleLoginUser);

module.exports = router;