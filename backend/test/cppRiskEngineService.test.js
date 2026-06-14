const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
    buildCppInput,
    getCppEngineStatus,
    getExecutablePath
} = require("../services/cppRiskEngineService");

test("C++ risk engine path resolves to the existing cpp_risk_engine directory", () => {
    const executablePath = getExecutablePath();

    assert.equal(path.basename(path.dirname(executablePath)), "cpp_risk_engine");
    assert.equal(fs.existsSync(executablePath), true);
});

test("C++ risk engine status reflects executable availability", () => {
    const status = getCppEngineStatus();

    assert.equal(status.available, fs.existsSync(status.path));
    assert.equal(status.path, getExecutablePath());
    assert.equal(status.platform, process.platform);
});

test("C++ risk engine input uses the expected line protocol", () => {
    const input = buildCppInput(
        {
            traderId: "T 1",
            stockSymbol: "tcs",
            tradeType: "buy",
            tradeTime: new Date(10000)
        },
        [],
        {
            maxTrades: 5,
            velocityWindowSeconds: 60,
            washWindowMinutes: 10,
            minSameSideTrades: 4,
            momentumWindowSeconds: 60
        }
    );

    assert.equal(
        input,
        [
            "T_1 TCS BUY 10000",
            "0",
            "5 60 10 4 60"
        ].join("\n")
    );
});
