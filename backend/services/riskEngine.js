const risk_config = {
    largeTradeValueThreshold: 1000000,
    unusualQuantityThreshold: 5000,
    restrictedStocks: ["PAYTM", "YESBANK", "ZEEL", "ADANIENT"],
    rapidTradeLimit: 3,
    rapidTradeWindowMinutes: 10
};

const getSeverityFromScore = (riskScore) => {
    if (riskScore >= 70) {
        return "HIGH";
    }

    if (riskScore >= 30) {
        return "MEDIUM";
    }

    return "LOW";
};

const calculateRiskScore = (trade, recentTrades = []) => {
    let riskScore = 0;
    const triggeredRules = [];
    const reasons = [];

    const tradeValue = trade.tradeValue || trade.quantity * trade.price;
    const stockSymbol = trade.stockSymbol.toUpperCase();

    if (tradeValue > risk_config.largeTradeValueThreshold) {
        riskScore += 40;

        triggeredRules.push("LARGE_TRADE_VALUE");

        reasons.push(
            `Trade value ${tradeValue} exceeded threshold ${risk_config.largeTradeValueThreshold}`
        );
    }

    if (trade.quantity > risk_config.unusualQuantityThreshold) {
        riskScore += 25;

        triggeredRules.push("UNUSUAL_QUANTITY");

        reasons.push(
            `Quantity ${trade.quantity} exceeded threshold ${risk_config.unusualQuantityThreshold}`
        );
    }

    if (risk_config.restrictedStocks.includes(stockSymbol)) {
        riskScore += 35;

        triggeredRules.push("RESTRICTED_STOCK");

        reasons.push(
            `${stockSymbol} is present in restricted stock watchlist`
        );
    }

    if (recentTrades.length >= risk_config.rapidTradeLimit) {
        riskScore += 30;

        triggeredRules.push("RAPID_REPEATED_TRADING");

        reasons.push(
            `Trader made ${recentTrades.length + 1} trades in ${stockSymbol} within ${risk_config.rapidTradeWindowMinutes} minutes`
        );
    }

    const isRisky = triggeredRules.length > 0;
    const severity = getSeverityFromScore(riskScore);

    return {
        isRisky,
        riskScore,
        severity,
        triggeredRules,
        reasons
    };
};

module.exports = {
    risk_config,
    calculateRiskScore
};