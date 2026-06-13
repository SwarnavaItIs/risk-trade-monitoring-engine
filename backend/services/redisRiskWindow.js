const { getRedisClient } = require("./redisClient");

const normalizeSymbol = (symbol) => {
    return String(symbol || "").toUpperCase().trim();
};

const getTradeTimestamp = (trade) => {
    if (trade.tradeTime) {
        return new Date(trade.tradeTime).getTime();
    }

    return Date.now();
};

const buildDuplicateOrderKey = (tradeData) => {
    const traderId = tradeData.traderId;
    const symbol = normalizeSymbol(tradeData.stockSymbol);
    const tradeType = tradeData.tradeType;
    const quantity = Number(tradeData.quantity);
    const price = Number(tradeData.price);

    return `risk:duplicate:${traderId}:${symbol}:${tradeType}:${quantity}:${price}`;
};

const checkAndStoreDuplicateTrade = async (tradeData, windowSeconds) => {
    const redis = getRedisClient();

    if (!redis) {
        return null;
    }

    try {
        const key = buildDuplicateOrderKey(tradeData);

        const result = await redis.set(
            key,
            "1",
            "EX",
            windowSeconds,
            "NX"
        );

        if (result === null) {
            return true;
        }

        return false;
    } catch (error) {
        console.log("Redis duplicate check failed:", error.message);
        return null;
    }
};

const recordTradeVelocity = async (trade, windowSeconds) => {
    const redis = getRedisClient();

    if (!redis) {
        return null;
    }

    try {
        const timestamp = getTradeTimestamp(trade);
        const windowStart = timestamp - windowSeconds * 1000;

        const key = `risk:velocity:${trade.traderId}`;
        const member = `${trade._id || Date.now()}:${normalizeSymbol(trade.stockSymbol)}:${trade.tradeType}:${trade.quantity}:${trade.price}`;

        await redis.zadd(key, timestamp, member);
        await redis.zremrangebyscore(key, 0, windowStart);
        await redis.expire(key, windowSeconds + 30);

        const count = await redis.zcard(key);

        return count;
    } catch (error) {
        console.log("Redis velocity check failed:", error.message);
        return null;
    }
};

const recordSameSideMomentum = async (trade, windowSeconds) => {
    const redis = getRedisClient();

    if (!redis) {
        return null;
    }

    try {
        const timestamp = getTradeTimestamp(trade);
        const windowStart = timestamp - windowSeconds * 1000;

        const symbol = normalizeSymbol(trade.stockSymbol);
        const key = `risk:momentum:${trade.traderId}:${symbol}:${trade.tradeType}`;
        const member = `${trade._id || Date.now()}:${trade.quantity}:${trade.price}`;

        await redis.zadd(key, timestamp, member);
        await redis.zremrangebyscore(key, 0, windowStart);
        await redis.expire(key, windowSeconds + 30);

        const count = await redis.zcard(key);

        return count;
    } catch (error) {
        console.log("Redis momentum check failed:", error.message);
        return null;
    }
};

module.exports = {
    checkAndStoreDuplicateTrade,
    recordTradeVelocity,
    recordSameSideMomentum
};