const express = require("express");

const {
    getTrades,
    createTrade,
    getTradeById,
    deleteTrade,
    updateTrade
} = require("../controllers/tradeController");

const router = express.Router();

router.get("/", getTrades);
router.post("/", createTrade);
router.get("/:id", getTradeById);
router.delete("/:id", deleteTrade);
router.put("/:id", updateTrade);

module.exports = router;