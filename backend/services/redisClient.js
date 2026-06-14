const Redis = require("ioredis");

let redisClient = null;
let redisConnected = false;
let lastRedisError = "";
const redisEnabled = Boolean(process.env.REDIS_URL);

const formatRedisError = (error) => {
    const errors = Array.isArray(error?.errors) ? error.errors : [error];
    const details = errors
        .map((item) => {
            const location = [item?.address, item?.port]
                .filter((value) => value !== undefined)
                .join(":");

            return [item?.code, location, item?.message]
                .filter(Boolean)
                .join(" ");
        })
        .filter(Boolean);

    return [...new Set(details)].join(" | ") || "Unknown Redis connection error";
};

if (redisEnabled) {
    redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
            return Math.min(times * 250, 2000);
        }
    });

    redisClient.on("connect", () => {
        redisConnected = false;
        console.log("Redis connection established");
    });

    redisClient.on("ready", () => {
        redisConnected = true;
        lastRedisError = "";
        console.log("Redis connected successfully");
    });

    redisClient.on("end", () => {
        redisConnected = false;
        console.log("Redis connection ended. MongoDB fallback will be used.");
    });

    redisClient.on("error", (error) => {
        redisConnected = false;
        const errorDetails = formatRedisError(error);

        if (errorDetails !== lastRedisError) {
            console.log("Redis connection error:", errorDetails);
            lastRedisError = errorDetails;
        }
    });
} else {
    console.log("REDIS_URL not found. Redis velocity checks will use MongoDB fallback.");
}

const getRedisClient = () => {
    return redisClient;
};

const isRedisConnected = () => {
    return redisEnabled && redisConnected && redisClient?.status === "ready";
};

module.exports = {
    getRedisClient,
    isRedisConnected
};
