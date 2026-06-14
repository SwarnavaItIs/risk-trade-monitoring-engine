const express = require("express");

const {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
    fillOrder
} = require("../controllers/orderController");
const { restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(restrictTo("ADMIN", "ANALYST"));

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);
router.put("/:id/fill", fillOrder);

module.exports = router;
