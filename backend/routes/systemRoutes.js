const express = require("express");

const {
    getEngineHealth,
    getMarketPrice
} = require("../controllers/systemController");
const { restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/engine-health", restrictTo("ADMIN"), getEngineHealth);
router.get("/market-price/:symbol", restrictTo("ADMIN"), getMarketPrice);

module.exports = router;
