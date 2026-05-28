const express = require("express");

const {
    getMe,
    registerUser,
    loginUser
} = require("../controllers/authController");

const {protect} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMe);
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;