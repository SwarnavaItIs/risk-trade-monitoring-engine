const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const DEFAULT_TIMEOUT_MS = 2000;
const MAX_OUTPUT_BYTES = 1024 * 1024;

const isCppRiskEngineEnabled = () => {
    return String(process.env.CPP_RISK_ENGINE_ENABLED || "true").toLowerCase() !== "false";
};

const getExecutablePath = () => {
    if (process.env.CPP_RISK_ENGINE_PATH) {
        return path.isAbsolute(process.env.CPP_RISK_ENGINE_PATH)
            ? process.env.CPP_RISK_ENGINE_PATH
            : path.resolve(__dirname, "..", process.env.CPP_RISK_ENGINE_PATH);
    }

    const executableName =
        process.platform === "win32"
            ? "risk_engine.exe"
            : "risk_engine";

    return path.join(__dirname, "..", "cpp_risk_engine", executableName);
};

const getTimeoutMs = () => {
    const configuredTimeout = Number(process.env.CPP_RISK_ENGINE_TIMEOUT_MS);

    return Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : DEFAULT_TIMEOUT_MS;
};

const getTimestampMs = (trade) => {
    const timestamp = trade.tradeTime || trade.createdAt || Date.now();
    const timestampMs = new Date(timestamp).getTime();

    if (!Number.isFinite(timestampMs)) {
        throw new Error("Trade contains an invalid timestamp");
    }

    return timestampMs;
};

const sanitize = (value) => {
    return String(value || "")
        .trim()
        .replace(/\s+/g, "_");
};

const buildCppInput = (trade, recentTrades, config) => {
    const lines = [];

    lines.push(
        [
            sanitize(trade.traderId),
            sanitize(trade.stockSymbol).toUpperCase(),
            sanitize(trade.tradeType).toUpperCase(),
            getTimestampMs(trade)
        ].join(" ")
    );

    lines.push(String(recentTrades.length));

    recentTrades.forEach((recentTrade) => {
        lines.push(
            [
                sanitize(recentTrade.traderId),
                sanitize(recentTrade.stockSymbol).toUpperCase(),
                sanitize(recentTrade.tradeType).toUpperCase(),
                getTimestampMs(recentTrade)
            ].join(" ")
        );
    });

    lines.push(
        [
            config.maxTrades,
            config.velocityWindowSeconds,
            config.washWindowMinutes,
            config.minSameSideTrades,
            config.momentumWindowSeconds
        ].join(" ")
    );

    return lines.join("\n");
};

const isValidCppResult = (result) => {
    return (
        result &&
        result.ok === true &&
        typeof result.isRisky === "boolean" &&
        Number.isFinite(result.riskScore) &&
        typeof result.severity === "string" &&
        Array.isArray(result.triggeredRules) &&
        Array.isArray(result.reasons) &&
        Array.isArray(result.ruleDetails)
    );
};

const runCppRiskEngine = async (trade, recentTrades = [], config = {}) => {
    if (!isCppRiskEngineEnabled()) {
        return null;
    }

    const executablePath = getExecutablePath();

    if (!fs.existsSync(executablePath)) {
        console.warn(`C++ risk engine unavailable: executable not found at ${executablePath}`);
        return null;
    }

    let input;

    try {
        input = buildCppInput(trade, recentTrades, config);
    }
    catch (error) {
        console.warn("C++ risk engine input failed:", error.message);
        return null;
    }

    return new Promise((resolve) => {
        let child;

        try {
            child = spawn(executablePath, [], {
                stdio: ["pipe", "pipe", "pipe"],
                windowsHide: true
            });
        }
        catch (error) {
            console.warn("C++ risk engine spawn failed:", error.message);
            resolve(null);
            return;
        }

        let output = "";
        let errorOutput = "";
        let finished = false;
        const timeoutMs = getTimeoutMs();

        const finish = (result) => {
            if (finished) {
                return;
            }

            finished = true;
            clearTimeout(timeout);
            resolve(result);
        };

        const timeout = setTimeout(() => {
            console.warn(`C++ risk engine timed out after ${timeoutMs}ms`);
            child.kill();
            finish(null);
        }, timeoutMs);

        child.stdout.on("data", (data) => {
            output += data.toString();

            if (output.length > MAX_OUTPUT_BYTES) {
                console.warn("C++ risk engine output exceeded the allowed size");
                child.kill();
                finish(null);
            }
        });

        child.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        child.on("error", (error) => {
            console.warn("C++ risk engine unavailable:", error.message);
            finish(null);
        });

        child.on("close", (exitCode) => {
            if (finished) {
                return;
            }

            if (exitCode !== 0) {
                console.warn(
                    `C++ risk engine exited with code ${exitCode}` +
                    (errorOutput ? `: ${errorOutput.trim()}` : "")
                );
                finish(null);
                return;
            }

            try {
                const parsed = JSON.parse(output.trim());

                if (!isValidCppResult(parsed)) {
                    console.warn(
                        "C++ risk engine returned an invalid response:",
                        parsed?.error || output.trim()
                    );
                    finish(null);
                    return;
                }

                if (String(process.env.CPP_RISK_ENGINE_LOG_SUCCESS).toLowerCase() === "true") {
                    console.log(`C++ risk engine used successfully: ${executablePath}`);
                }

                finish({
                    ...parsed,
                    evaluationEngine: "CPP"
                });
            }
            catch (error) {
                console.warn("C++ risk engine JSON parse failed:", error.message);

                if (errorOutput) {
                    console.warn("C++ stderr:", errorOutput.trim());
                }

                finish(null);
            }
        });

        child.stdin.on("error", (error) => {
            console.warn("C++ risk engine stdin failed:", error.message);
            finish(null);
        });

        try {
            child.stdin.end(input);
        }
        catch (error) {
            console.warn("C++ risk engine stdin write failed:", error.message);
            finish(null);
        }
    });
};

module.exports = {
    buildCppInput,
    getExecutablePath,
    isCppRiskEngineEnabled,
    runCppRiskEngine
};
