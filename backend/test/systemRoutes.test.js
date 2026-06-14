const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

const systemRoutes = require("../routes/systemRoutes");

const createTestServer = () => {
    const app = express();

    app.use("/api/system", (req, res, next) => {
        req.user = {
            role: req.headers["x-test-role"] || "ANALYST"
        };
        next();
    }, systemRoutes);

    return app.listen(0);
};

test("engine health endpoint returns status data to admins", async (t) => {
    const server = createTestServer();
    t.after(() => server.close());

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/system/engine-health`, {
        headers: {
            "x-test-role": "ADMIN"
        }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, "Engine health fetched successfully");
    assert.equal(typeof body.data.redis.connected, "boolean");
    assert.equal(typeof body.data.cppEngine.available, "boolean");
    assert.equal(typeof body.data.cppEngine.path, "string");
    assert.equal(typeof body.data.cppEngine.platform, "string");
});

test("engine health endpoint rejects analysts", async (t) => {
    const server = createTestServer();
    t.after(() => server.close());

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/system/engine-health`, {
        headers: {
            "x-test-role": "ANALYST"
        }
    });

    assert.equal(response.status, 403);
});

test("market price endpoint returns fallback market data to admins", async (t) => {
    const server = createTestServer();
    t.after(() => server.close());

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/system/market-price/infy`, {
        headers: {
            "x-test-role": "ADMIN"
        }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.message, "Market price fetched successfully");
    assert.deepEqual(body.data, {
        symbol: "INFY",
        price: 1500,
        source: "STATIC_FALLBACK"
    });
});

test("market price endpoint rejects analysts", async (t) => {
    const server = createTestServer();
    t.after(() => server.close());

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/system/market-price/TCS`, {
        headers: {
            "x-test-role": "ANALYST"
        }
    });

    assert.equal(response.status, 403);
});
