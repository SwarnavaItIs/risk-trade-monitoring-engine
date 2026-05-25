const express = require("express");

const {
    testAuth,
    registerUser,
    loginUser
} = require("../controllers/authController");

const router = express.Router();

router.get("/test", testAuth);
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;