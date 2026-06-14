const { isRedisConnected } = require("../services/redisClient");
const { getCppEngineStatus } = require("../services/cppRiskEngineService");
const { getLatestMarketPrice } = require("../services/marketDataService");

const getEngineHealth = (req, res) => {
    const redisUrlConfigured = Boolean(process.env.REDIS_URL);
    const configuredMarketDataProvider = String(
        process.env.MARKET_DATA_PROVIDER || "STATIC_FALLBACK"
    ).toUpperCase();
    const marketDataConfigured =
        configuredMarketDataProvider === "FINNHUB" &&
        Boolean(process.env.FINNHUB_API_KEY);

    res.status(200).json({
        message: "Engine health fetched successfully",
        data: {
            redis: {
                enabled: redisUrlConfigured,
                connected: isRedisConnected(),
                urlConfigured: redisUrlConfigured
            },
            cppEngine: getCppEngineStatus(),
            marketData: {
                provider: marketDataConfigured ? "FINNHUB" : "STATIC_FALLBACK",
                configured: marketDataConfigured
            },
            fallbacks: {
                redisFallback: "MongoDB fallback for R4/R6/R8",
                cppFallback: "JavaScript/Redis behavioral engine fallback",
                marketDataFallback: "Static reference prices"
            }
        }
    });
};

const getMarketPrice = async (req, res) => {
    const symbol = String(req.params.symbol || "").toUpperCase().trim();

    if (!symbol) {
        return res.status(400).json({
            message: "Market data symbol is required"
        });
    }

    const marketPrice = await getLatestMarketPrice(symbol);

    res.status(200).json({
        message: "Market price fetched successfully",
        data: {
            symbol,
            ...marketPrice
        }
    });
};

module.exports = {
    getEngineHealth,
    getMarketPrice
};
