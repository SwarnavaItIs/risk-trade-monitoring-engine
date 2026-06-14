const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const RiskRule = require("../models/RiskRules");
const AuditLog = require("../models/AuditLog");
const {
    cancelOrder,
    createOrder,
    getOrders,
    fillOrder
} = require("../controllers/orderController");

const user = {
    _id: new mongoose.Types.ObjectId(),
    name: "Analyst User",
    email: "analyst@example.com",
    role: "ANALYST"
};

const createResponse = () => {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
};

const buildOrder = (overrides = {}) => {
    const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        orderId: "ORDER-100",
        traderId: "T1001",
        traderName: "Test Trader",
        stockSymbol: "TCS",
        side: "BUY",
        quantity: 10,
        price: 100,
        ...overrides
    });

    order.save = async () => order;

    return order;
};

test("order controller creates, cancels, and fills orders", async (context) => {
    const originalCreate = Order.create;
    const originalFindById = Order.findById;
    const originalRuleFind = RiskRule.find;
    const originalAuditCreate = AuditLog.create;
    let currentOrder;
    const auditActions = [];

    context.after(() => {
        Order.create = originalCreate;
        Order.findById = originalFindById;
        RiskRule.find = originalRuleFind;
        AuditLog.create = originalAuditCreate;
    });

    RiskRule.find = () => ({
        sort: async () => []
    });
    AuditLog.create = async (log) => {
        auditActions.push(log.action);
        return log;
    };
    Order.create = async (data) => {
        currentOrder = buildOrder(data);
        currentOrder.orderValue = currentOrder.quantity * currentOrder.price;
        return currentOrder;
    };
    Order.findById = async () => currentOrder;

    const createRes = createResponse();
    await createOrder({
        user,
        body: {
            orderId: "ORDER-100",
            traderId: "T1001",
            traderName: "Test Trader",
            stockSymbol: "tcs",
            side: "buy",
            quantity: 10,
            price: 100
        },
        headers: {},
        get: () => ""
    }, createRes);

    assert.equal(createRes.statusCode, 201);
    assert.equal(createRes.body.data.order.status, "SUBMITTED");

    const partialFillRes = createResponse();
    await fillOrder({
        user,
        params: { id: currentOrder._id.toString() },
        body: { filledQuantity: 4 },
        headers: {},
        get: () => ""
    }, partialFillRes);

    assert.equal(partialFillRes.statusCode, 200);
    assert.equal(currentOrder.status, "PARTIALLY_FILLED");
    assert.equal(currentOrder.filledQuantity, 4);

    const cancelRes = createResponse();
    await cancelOrder({
        user,
        params: { id: currentOrder._id.toString() },
        body: {},
        headers: {},
        get: () => ""
    }, cancelRes);

    assert.equal(cancelRes.statusCode, 200);
    assert.equal(currentOrder.status, "CANCELLED");

    currentOrder = buildOrder({
        orderId: "ORDER-101"
    });

    const fullFillRes = createResponse();
    await fillOrder({
        user,
        params: { id: currentOrder._id.toString() },
        body: {},
        headers: {},
        get: () => ""
    }, fullFillRes);

    assert.equal(fullFillRes.statusCode, 200);
    assert.equal(currentOrder.status, "FILLED");
    assert.equal(currentOrder.filledQuantity, currentOrder.quantity);
    assert.deepEqual(auditActions, [
        "ORDER_CREATED",
        "ORDER_FILLED",
        "ORDER_CANCELLED",
        "ORDER_FILLED"
    ]);
});

test("order controller applies lifecycle filters", async (context) => {
    const originalFind = Order.find;
    const originalCountDocuments = Order.countDocuments;
    let capturedQuery;

    context.after(() => {
        Order.find = originalFind;
        Order.countDocuments = originalCountDocuments;
    });

    Order.find = (query) => {
        capturedQuery = query;

        return {
            populate() {
                return this;
            },
            sort() {
                return this;
            },
            skip() {
                return this;
            },
            limit: async () => []
        };
    };
    Order.countDocuments = async () => 0;

    const res = createResponse();
    await getOrders({
        query: {
            traderId: "T1001",
            stockSymbol: "tcs",
            status: "cancelled",
            side: "sell"
        }
    }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedQuery, {
        traderId: "T1001",
        stockSymbol: "TCS",
        status: "CANCELLED",
        side: "SELL"
    });
});
