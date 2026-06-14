const mongoose = require("mongoose");

const Order = require("../models/Order");
const Alert = require("../models/Alert");
const { evaluateOrderLifecycleRisk } = require("../services/behavioralRiskEngine");
const { logOrderAlertRuleEvents } = require("../services/riskEventLogger");
const {
    buildChanges,
    createAuditLog
} = require("../services/auditLogService");

const allowedSides = ["BUY", "SELL"];
const allowedSources = ["MANUAL", "CSV", "SYSTEM"];

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const validateOrderInput = (body) => {
    const orderId = String(body.orderId || "").trim();
    const traderId = String(body.traderId || "").trim();
    const traderName = String(body.traderName || "").trim();
    const stockSymbol = String(body.stockSymbol || "").toUpperCase().trim();
    const side = String(body.side || "").toUpperCase().trim();
    const source = String(body.source || "MANUAL").toUpperCase().trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!orderId || !traderId || !traderName || !stockSymbol || !side) {
        return {
            isValid: false,
            message: "orderId, traderId, traderName, stockSymbol, and side are required"
        };
    }

    if (!allowedSides.includes(side)) {
        return {
            isValid: false,
            message: "side must be BUY or SELL"
        };
    }

    if (!allowedSources.includes(source)) {
        return {
            isValid: false,
            message: "source must be MANUAL, CSV, or SYSTEM"
        };
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
        return {
            isValid: false,
            message: "quantity must be a positive number"
        };
    }

    if (!Number.isFinite(price) || price <= 0) {
        return {
            isValid: false,
            message: "price must be a positive number"
        };
    }

    return {
        isValid: true,
        data: {
            orderId,
            traderId,
            traderName,
            stockSymbol,
            side,
            quantity,
            price,
            source
        }
    };
};

const buildOrderQuery = (queryParams) => {
    const query = {};

    if (queryParams.traderId) {
        query.traderId = queryParams.traderId.trim();
    }

    if (queryParams.stockSymbol) {
        query.stockSymbol = queryParams.stockSymbol.toUpperCase().trim();
    }

    if (queryParams.status) {
        query.status = queryParams.status.toUpperCase().trim();
    }

    if (queryParams.side) {
        query.side = queryParams.side.toUpperCase().trim();
    }

    return query;
};

const getOrderAuditMetadata = (order) => {
    return {
        orderId: order.orderId,
        traderId: order.traderId,
        stockSymbol: order.stockSymbol,
        side: order.side,
        quantity: order.quantity,
        filledQuantity: order.filledQuantity,
        status: order.status
    };
};

const createOrderRiskAlert = async (order) => {
    const riskResult = await evaluateOrderLifecycleRisk(order);
    let alert = null;

    if (riskResult.isRisky) {
        alert = await Alert.create({
            orderId: order._id,
            traderId: order.traderId,
            traderName: order.traderName,
            stockSymbol: order.stockSymbol,
            alertType: "R9_ORDER_TO_TRADE_RATIO",
            severity: riskResult.severity,
            riskScore: riskResult.riskScore,
            triggeredRules: riskResult.triggeredRules,
            reasons: riskResult.reasons,
            message: `Order lifecycle flagged as ${riskResult.severity} risk due to: ${riskResult.reasons.join("; ")}`,
            status: "PENDING"
        });

        await logOrderAlertRuleEvents({
            order,
            alert,
            riskResult
        });
    }

    return {
        alert,
        riskResult
    };
};

const createOrder = async (req, res) => {
    try {
        const validation = validateOrderInput(req.body);

        if (!validation.isValid) {
            return res.status(400).json({
                message: validation.message
            });
        }

        const order = await Order.create({
            ...validation.data,
            createdBy: req.user?._id || null
        });

        await createAuditLog({
            req,
            action: "ORDER_CREATED",
            target: {
                entityType: "ORDER",
                entityId: order._id.toString(),
                label: `${order.orderId} - ${order.traderId}`
            },
            metadata: getOrderAuditMetadata(order)
        });

        const { alert, riskResult } = await createOrderRiskAlert(order);

        res.status(201).json({
            message: "Order created successfully",
            data: {
                order,
                alert,
                riskResult
            }
        });
    }
    catch (error) {
        res.status(400).json({
            message: error.code === 11000
                ? "Order ID already exists"
                : "Failed to create order",
            error: error.message
        });
    }
};

const getOrders = async (req, res) => {
    try {
        const query = buildOrderQuery(req.query);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .populate("createdBy", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            message: "Orders fetched successfully",
            count: orders.length,
            totalOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            data: orders
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(req.params.id)
            .populate("createdBy", "name email role");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order fetched successfully",
            data: order
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch order",
            error: error.message
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.status === "CANCELLED") {
            return res.status(400).json({
                message: "Order is already cancelled"
            });
        }

        if (order.status === "FILLED") {
            return res.status(400).json({
                message: "Filled orders cannot be cancelled"
            });
        }

        const previousOrder = order.toObject();

        order.status = "CANCELLED";
        order.cancelledAt = new Date();
        await order.save();

        await createAuditLog({
            req,
            action: "ORDER_CANCELLED",
            target: {
                entityType: "ORDER",
                entityId: order._id.toString(),
                label: `${order.orderId} - ${order.traderId}`
            },
            changes: buildChanges(previousOrder, order, ["status", "cancelledAt"]),
            metadata: getOrderAuditMetadata(order)
        });

        const { alert, riskResult } = await createOrderRiskAlert(order);

        res.status(200).json({
            message: "Order cancelled successfully",
            data: {
                order,
                alert,
                riskResult
            }
        });
    }
    catch (error) {
        res.status(400).json({
            message: "Failed to cancel order",
            error: error.message
        });
    }
};

const fillOrder = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.status === "CANCELLED") {
            return res.status(400).json({
                message: "Cancelled orders cannot be filled"
            });
        }

        if (order.status === "FILLED") {
            return res.status(400).json({
                message: "Order is already filled"
            });
        }

        const remainingQuantity = order.quantity - order.filledQuantity;
        const requestedFillQuantity = req.body.filledQuantity === undefined
            ? remainingQuantity
            : Number(req.body.filledQuantity);

        if (
            !Number.isFinite(requestedFillQuantity) ||
            requestedFillQuantity <= 0 ||
            requestedFillQuantity > remainingQuantity
        ) {
            return res.status(400).json({
                message: `filledQuantity must be between 1 and ${remainingQuantity}`
            });
        }

        const previousOrder = order.toObject();

        order.filledQuantity += requestedFillQuantity;
        order.status = order.filledQuantity === order.quantity
            ? "FILLED"
            : "PARTIALLY_FILLED";
        order.filledAt = new Date();
        await order.save();

        await createAuditLog({
            req,
            action: "ORDER_FILLED",
            target: {
                entityType: "ORDER",
                entityId: order._id.toString(),
                label: `${order.orderId} - ${order.traderId}`
            },
            changes: buildChanges(
                previousOrder,
                order,
                ["status", "filledQuantity", "filledAt"]
            ),
            metadata: {
                ...getOrderAuditMetadata(order),
                fillQuantity: requestedFillQuantity
            }
        });

        const { alert, riskResult } = await createOrderRiskAlert(order);

        res.status(200).json({
            message: order.status === "FILLED"
                ? "Order filled successfully"
                : "Order partially filled successfully",
            data: {
                order,
                alert,
                riskResult
            }
        });
    }
    catch (error) {
        res.status(400).json({
            message: "Failed to fill order",
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
    fillOrder
};
