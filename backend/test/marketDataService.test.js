const test = require("node:test");
const assert = require("node:assert/strict");

const redisClientService = require("../services/redisClient");
const { getLatestMarketPrice } = require("../services/marketDataService");

const preserveDependencies = (context) => {
    const originalGetRedisClient = redisClientService.getRedisClient;
    const originalIsRedisConnected = redisClientService.isRedisConnected;
    const originalFetch = global.fetch;
    const originalProvider = process.env.MARKET_DATA_PROVIDER;
    const originalApiKey = process.env.FINNHUB_API_KEY;

    context.after(() => {
        redisClientService.getRedisClient = originalGetRedisClient;
        redisClientService.isRedisConnected = originalIsRedisConnected;
        global.fetch = originalFetch;

        if (originalProvider === undefined) {
            delete process.env.MARKET_DATA_PROVIDER;
        }
        else {
            process.env.MARKET_DATA_PROVIDER = originalProvider;
        }

        if (originalApiKey === undefined) {
            delete process.env.FINNHUB_API_KEY;
        }
        else {
            process.env.FINNHUB_API_KEY = originalApiKey;
        }
    });
};

test("market data uses static fallback when Finnhub is not configured", async (context) => {
    preserveDependencies(context);
    delete process.env.FINNHUB_API_KEY;
    process.env.MARKET_DATA_PROVIDER = "FINNHUB";
    redisClientService.isRedisConnected = () => false;

    const result = await getLatestMarketPrice("infy");

    assert.deepEqual(result, {
        price: 1500,
        source: "STATIC_FALLBACK"
    });
});

test("market data returns unavailable for an unknown symbol", async (context) => {
    preserveDependencies(context);
    delete process.env.FINNHUB_API_KEY;
    redisClientService.isRedisConnected = () => false;

    const result = await getLatestMarketPrice("UNKNOWN");

    assert.deepEqual(result, {
        price: null,
        source: "UNAVAILABLE"
    });
});

test("market data returns unavailable for an empty symbol", async (context) => {
    preserveDependencies(context);
    let redisChecked = false;

    redisClientService.isRedisConnected = () => {
        redisChecked = true;
        return true;
    };

    const result = await getLatestMarketPrice(" ");

    assert.deepEqual(result, {
        price: null,
        source: "UNAVAILABLE"
    });
    assert.equal(redisChecked, false);
});

test("market data reads a valid Redis cached price first", async (context) => {
    preserveDependencies(context);
    let fetchCalled = false;

    redisClientService.isRedisConnected = () => true;
    redisClientService.getRedisClient = () => ({
        get: async (key) => {
            assert.equal(key, "market:last-price:TCS");
            return "3525.5";
        }
    });
    global.fetch = async () => {
        fetchCalled = true;
        return {};
    };

    const result = await getLatestMarketPrice("tcs");

    assert.deepEqual(result, {
        price: 3525.5,
        source: "REDIS_CACHE"
    });
    assert.equal(fetchCalled, false);
});

test("market data uses and caches Finnhub after a Redis read failure", async (context) => {
    preserveDependencies(context);
    let cachedCommand;

    process.env.MARKET_DATA_PROVIDER = "finnhub";
    process.env.FINNHUB_API_KEY = "test_key";
    redisClientService.isRedisConnected = () => true;
    redisClientService.getRedisClient = () => ({
        get: async () => {
            throw new Error("Redis unavailable");
        },
        set: async (...args) => {
            cachedCommand = args;
        }
    });
    global.fetch = async (url) => {
        assert.match(url, /symbol=TCS\.NS/);
        assert.match(url, /token=test_key/);

        return {
            ok: true,
            json: async () => ({ c: 3600 })
        };
    };

    const result = await getLatestMarketPrice("TCS");

    assert.deepEqual(result, {
        price: 3600,
        source: "FINNHUB"
    });
    assert.deepEqual(cachedCommand, [
        "market:last-price:TCS",
        3600,
        "EX",
        60
    ]);
});

test("market data falls back when Finnhub fails", async (context) => {
    preserveDependencies(context);
    process.env.MARKET_DATA_PROVIDER = "FINNHUB";
    process.env.FINNHUB_API_KEY = "test_key";
    redisClientService.isRedisConnected = () => false;
    global.fetch = async () => {
        throw new Error("Provider unavailable");
    };

    const result = await getLatestMarketPrice("RELIANCE");

    assert.deepEqual(result, {
        price: 2800,
        source: "STATIC_FALLBACK"
    });
});

test("market data still returns Finnhub when the cache write fails", async (context) => {
    preserveDependencies(context);
    process.env.MARKET_DATA_PROVIDER = "FINNHUB";
    process.env.FINNHUB_API_KEY = "test_key";
    redisClientService.isRedisConnected = () => true;
    redisClientService.getRedisClient = () => ({
        get: async () => null,
        set: async () => {
            throw new Error("Redis write unavailable");
        }
    });
    global.fetch = async () => ({
        ok: true,
        json: async () => ({ c: 1700 })
    });

    const result = await getLatestMarketPrice("HDFCBANK");

    assert.deepEqual(result, {
        price: 1700,
        source: "FINNHUB"
    });
});
