const express = require("express");
const multer = require("multer");
const fs = require("fs");

const {
    getTrades,
    createTrade,
    getTradeById,
    deleteTrade,
    updateTrade,
    uploadTradesCSV
} = require("../controllers/tradeController");

fs.mkdirSync("uploads", { recursive: true });

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/", getTrades);
router.post("/", createTrade);
router.post("/upload", upload.single("file"), uploadTradesCSV);
router.get("/:id", getTradeById);
router.delete("/:id", deleteTrade);
router.put("/:id", updateTrade);

module.exports = router;