const redisClientService = require("./redisClient");

const defaultMarketPrices = {
    RELIANCE: 2800,
    TCS: 3500,
    INFY: 1500,
    PAYTM: 450,
    YESBANK: 25,
    HDFCBANK: 1650,
    ICICIBANK: 1100
};

const symbolMap = {
    RELIANCE: "RELIANCE.NS",
    TCS: "TCS.NS",
    INFY: "INFY.NS",
    PAYTM: "PAYTM.NS",
    YESBANK: "YESBANK.NS",
    HDFCBANK: "HDFCBANK.NS",
    ICICIBANK: "ICICIBANK.NS"
};

const normalizeSymbol = (symbol) => {
    return String(symbol || "").toUpperCase().trim();
};

const isPositivePrice = (value) => {
    return Number.isFinite(Number(value)) && Number(value) > 0;
};

const getFallbackPrice = (symbol) => {
    return defaultMarketPrices[normalizeSymbol(symbol)] || null;
};

const fetchFinnhubQuote = async (symbol) => {
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey || typeof fetch !== "function") {
        return null;
    }

    const providerSymbol = symbolMap[normalizeSymbol(symbol)] || normalizeSymbol(symbol);

    const url =
        "https://finnhub.io/api/v1/quote" +
        `?symbol=${encodeURIComponent(providerSymbol)}` +
        `&token=${encodeURIComponent(apiKey)}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (!isPositivePrice(data?.c)) {
            return null;
        }

        return Number(data.c);
    }
    catch (error) {
        console.log("Finnhub market data fetch failed:", error.message);
        return null;
    }
};

const readCachedPrice = async (cacheKey) => {
    if (!redisClientService.isRedisConnected()) {
        return null;
    }

    try {
        const cachedPrice = await redisClientService.getRedisClient().get(cacheKey);

        return isPositivePrice(cachedPrice) ? Number(cachedPrice) : null;
    }
    catch (error) {
        console.log("Market data cache read failed:", error.message);
        return null;
    }
};

const cacheLatestPrice = async (cacheKey, price) => {
    if (!redisClientService.isRedisConnected()) {
        return;
    }

    try {
        await redisClientService.getRedisClient().set(cacheKey, price, "EX", 60);
    }
    catch (error) {
        console.log("Market data cache write failed:", error.message);
    }
};

const getLatestMarketPrice = async (symbol) => {
    const normalizedSymbol = normalizeSymbol(symbol);

    if (!normalizedSymbol) {
        return {
            price: null,
            source: "UNAVAILABLE"
        };
    }

    const cacheKey = `market:last-price:${normalizedSymbol}`;
    const cachedPrice = await readCachedPrice(cacheKey);

    if (cachedPrice !== null) {
        return {
            price: cachedPrice,
            source: "REDIS_CACHE"
        };
    }

    const configuredProvider = String(
        process.env.MARKET_DATA_PROVIDER || ""
    ).toUpperCase();
    const livePrice = configuredProvider === "FINNHUB"
        ? await fetchFinnhubQuote(normalizedSymbol)
        : null;

    if (livePrice !== null) {
        await cacheLatestPrice(cacheKey, livePrice);

        return {
            price: livePrice,
            source: "FINNHUB"
        };
    }

    const fallbackPrice = getFallbackPrice(normalizedSymbol);

    if (fallbackPrice !== null) {
        return {
            price: fallbackPrice,
            source: "STATIC_FALLBACK"
        };
    }

    return {
        price: null,
        source: "UNAVAILABLE"
    };
};

module.exports = {
    getLatestMarketPrice
};
