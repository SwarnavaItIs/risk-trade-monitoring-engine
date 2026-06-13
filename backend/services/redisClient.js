const Redis = require("ioredis");

let redisClient = null;

if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
            if (times > 3) {
                return null;
            }

            return Math.min(times * 100, 1000);
        }
    });

    redisClient.on("connect", () => {
        console.log("Redis connected successfully");
    });

    redisClient.on("error", (error) => {
        console.log("Redis connection error:", error.message);
    });
} else {
    console.log("REDIS_URL not found. Redis velocity checks will use MongoDB fallback.");
}

const getRedisClient = () => {
    return redisClient;
};

module.exports = {
    getRedisClient
};