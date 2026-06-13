require("dotenv").config();

const {
    getExecutablePath,
    runCppRiskEngine
} = require("../services/cppRiskEngineService");

const timestamp = Date.now();

const trade = {
    traderId: "CPP_CHECK_TRADER",
    stockSymbol: "TCS",
    tradeType: "BUY",
    tradeTime: new Date(timestamp)
};

const recentTrades = [
    {
        traderId: "CPP_CHECK_TRADER",
        stockSymbol: "TCS",
        tradeType: "SELL",
        tradeTime: new Date(timestamp - 1000)
    }
];

const config = {
    maxTrades: 5,
    velocityWindowSeconds: 60,
    washWindowMinutes: 10,
    minSameSideTrades: 4,
    momentumWindowSeconds: 60
};

runCppRiskEngine(trade, recentTrades, config)
    .then((result) => {
        if (!result || result.evaluationEngine !== "CPP") {
            throw new Error("C++ risk engine was not used");
        }

        console.log(`C++ risk engine check passed: ${getExecutablePath()}`);
        console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
        console.error(`C++ risk engine check failed: ${error.message}`);
        process.exitCode = 1;
    });
