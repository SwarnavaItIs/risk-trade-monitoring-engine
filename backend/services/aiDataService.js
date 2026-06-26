const Trade = require("../models/Trade");
const Alert = require("../models/Alert");
const RiskEvent = require("../models/RiskEvent");
const RiskRule = require("../models/RiskRules");

const getDateRange = (dateValue) => {
    const date = dateValue ? new Date(dateValue) : new Date();

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

const getRuleCode = (item) => {
    return (
        item.ruleCode ||
        item.ruleId ||
        item.triggeredRule ||
        item.ruleName ||
        item.rule?.ruleCode ||
        item.rule?.ruleName ||
        "UNKNOWN_RULE"
    );
};

const getTraderId = (item) => {
    return (
        item.traderId ||
        item.trader ||
        item.trade?.traderId ||
        item.metadata?.traderId ||
        "UNKNOWN_TRADER"
    );
};

const getSymbol = (item) => {
    return (
        item.stockSymbol ||
        item.symbol ||
        item.trade?.stockSymbol ||
        item.metadata?.stockSymbol ||
        "UNKNOWN_SYMBOL"
    );
};

const incrementCount = (map, key) => {
    if (!key) return;
    map[key] = (map[key] || 0) + 1;
};

const mapToSortedArray = (map, limit = 10) => {
    return Object.entries(map)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

const isBlockedEvent = (event) => {
    const combinedText = `${event.eventType || ""} ${event.action || ""} ${event.status || ""} ${event.outcome || ""}`.toUpperCase();

    return combinedText.includes("BLOCK");
};

const isHighSeverityAlert = (alert) => {
    const severity = String(alert.severity || "").toUpperCase();

    return ["HIGH", "CRITICAL", "SEVERE"].includes(severity);
};

const collectDailyRiskReportData = async (dateValue) => {
    const { start, end } = getDateRange(dateValue);

    const [totalTrades, alerts, riskEvents, activeRules] = await Promise.all([
        Trade.countDocuments({
            createdAt: { $gte: start, $lte: end }
        }),

        Alert.find({
            createdAt: { $gte: start, $lte: end }
        })
            .sort({ createdAt: -1 })
            .limit(500)
            .lean(),

        RiskEvent.find({
            createdAt: { $gte: start, $lte: end }
        })
            .sort({ createdAt: -1 })
            .limit(500)
            .lean(),

        RiskRule.countDocuments({
            enabled: true
        })
    ]);

    const ruleCounts = {};
    const traderCounts = {};
    const symbolCounts = {};
    const blockedRuleCounts = {};

    riskEvents.forEach((event) => {
        const ruleCode = getRuleCode(event);
        const traderId = getTraderId(event);
        const symbol = getSymbol(event);

        incrementCount(ruleCounts, ruleCode);
        incrementCount(traderCounts, traderId);
        incrementCount(symbolCounts, symbol);

        if (isBlockedEvent(event)) {
            incrementCount(blockedRuleCounts, ruleCode);
        }
    });

    alerts.forEach((alert) => {
        const traderId = getTraderId(alert);
        const symbol = getSymbol(alert);

        incrementCount(traderCounts, traderId);
        incrementCount(symbolCounts, symbol);

        if (Array.isArray(alert.triggeredRules)) {
            alert.triggeredRules.forEach((rule) => {
                incrementCount(ruleCounts, rule.ruleCode || rule.code || rule.name || rule);
            });
        }
    });

    const blockedEvents = riskEvents.filter(isBlockedEvent);
    const highSeverityAlerts = alerts.filter(isHighSeverityAlert);

    return {
        dateRange: {
            start,
            end
        },

        metrics: {
            totalTrades,
            totalAlerts: alerts.length,
            totalRiskEvents: riskEvents.length,
            blockedEvents: blockedEvents.length,
            highSeverityAlerts: highSeverityAlerts.length,
            activeRules
        },

        topTriggeredRules: mapToSortedArray(ruleCounts, 10),
        topBlockedRules: mapToSortedArray(blockedRuleCounts, 10),
        topRiskyTraders: mapToSortedArray(traderCounts, 10),
        topSymbols: mapToSortedArray(symbolCounts, 10),

        recentHighSeverityAlerts: highSeverityAlerts.slice(0, 5).map((alert) => ({
            id: alert._id,
            traderId: getTraderId(alert),
            stockSymbol: getSymbol(alert),
            severity: alert.severity,
            status: alert.status,
            reason: alert.reason,
            riskScore: alert.riskScore,
            createdAt: alert.createdAt
        })),

        recentRiskEvents: riskEvents.slice(0, 8).map((event) => ({
            id: event._id,
            ruleCode: getRuleCode(event),
            traderId: getTraderId(event),
            stockSymbol: getSymbol(event),
            eventType: event.eventType,
            action: event.action,
            reason: event.reason,
            severity: event.severity,
            createdAt: event.createdAt
        }))
    };
};

const detectRiskAssistantIntent = (question = "") => {
    const q = question.toLowerCase();

    if (
        q.includes("risky trader") ||
        q.includes("top trader") ||
        q.includes("high risk trader") ||
        q.includes("which trader")
    ) {
        return "TOP_RISKY_TRADERS";
    }

    if (
        q.includes("triggered rule") ||
        q.includes("top rule") ||
        q.includes("most triggered") ||
        q.includes("rule triggered")
    ) {
        return "TOP_TRIGGERED_RULES";
    }

    if (
        q.includes("blocked") ||
        q.includes("block") ||
        q.includes("rejected")
    ) {
        return "BLOCKED_TRADE_SUMMARY";
    }

    if (
        q.includes("high severity") ||
        q.includes("critical") ||
        q.includes("severe")
    ) {
        return "HIGH_SEVERITY_ALERTS";
    }

    if (
        q.includes("recent alert") ||
        q.includes("latest alert") ||
        q.includes("alerts")
    ) {
        return "RECENT_ALERTS";
    }

    return "GENERAL_RISK_OVERVIEW";
};

const extractPossibleSymbol = (question = "") => {
    const knownSymbols = [
        "RELIANCE",
        "TCS",
        "INFY",
        "PAYTM",
        "YESBANK",
        "HDFCBANK",
        "ICICIBANK"
    ];

    const upperQuestion = question.toUpperCase();

    return knownSymbols.find((symbol) => upperQuestion.includes(symbol));
};

const extractPossibleTraderId = (question = "") => {
    const match = question.match(/\b[A-Z]{1,5}\d{2,10}\b/i);
    return match ? match[0].toUpperCase() : null;
};

const collectRiskAssistantData = async (question) => {
    const intent = detectRiskAssistantIntent(question);
    const symbol = extractPossibleSymbol(question);
    const traderId = extractPossibleTraderId(question);

    const filter = {};

    if (symbol) {
        filter.stockSymbol = symbol;
    }

    if (traderId) {
        filter.traderId = traderId;
    }

    let data = {};

    if (intent === "TOP_RISKY_TRADERS") {
        const alerts = await Alert.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$traderId",
                    totalAlerts: { $sum: 1 },
                    avgRiskScore: { $avg: "$riskScore" },
                    highSeverityCount: {
                        $sum: {
                            $cond: [
                                {
                                    $in: [
                                        { $toUpper: "$severity" },
                                        ["HIGH", "CRITICAL", "SEVERE"]
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { totalAlerts: -1, avgRiskScore: -1 } },
            { $limit: 10 }
        ]);

        data = {
            intent,
            filters: { symbol, traderId },
            topRiskyTraders: alerts
        };
    }

    else if (intent === "TOP_TRIGGERED_RULES") {
        const riskEvents = await RiskEvent.aggregate([
            {
                $group: {
                    _id: "$ruleCode",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        data = {
            intent,
            filters: { symbol, traderId },
            topTriggeredRules: riskEvents
        };
    }

    else if (intent === "BLOCKED_TRADE_SUMMARY") {
        const blockedEvents = await RiskEvent.find({
            $or: [
                { eventType: /BLOCK/i },
                { action: /BLOCK/i },
                { status: /BLOCK/i },
                { outcome: /BLOCK/i }
            ],
            ...filter
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        data = {
            intent,
            filters: { symbol, traderId },
            blockedEvents
        };
    }

    else if (intent === "HIGH_SEVERITY_ALERTS") {
        const alerts = await Alert.find({
            severity: { $in: ["HIGH", "CRITICAL", "SEVERE", "High", "Critical", "Severe"] },
            ...filter
        })
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        data = {
            intent,
            filters: { symbol, traderId },
            highSeverityAlerts: alerts
        };
    }

    else if (intent === "RECENT_ALERTS") {
        const alerts = await Alert.find(filter)
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        data = {
            intent,
            filters: { symbol, traderId },
            recentAlerts: alerts
        };
    }

    else {
        const [totalTrades, totalAlerts, totalRiskEvents, recentAlerts] =
            await Promise.all([
                Trade.countDocuments(filter),
                Alert.countDocuments(filter),
                RiskEvent.countDocuments(filter),
                Alert.find(filter).sort({ createdAt: -1 }).limit(10).lean()
            ]);

        data = {
            intent,
            filters: { symbol, traderId },
            overview: {
                totalTrades,
                totalAlerts,
                totalRiskEvents,
                recentAlerts
            }
        };
    }

    return {
        intent,
        data
    };
};

const collectRuleTuningData = async () => {
    const rules = await RiskRule.find({})
        .sort({ ruleCode: 1 })
        .lean();

    const riskEventCounts = await RiskEvent.aggregate([
        {
            $group: {
                _id: "$ruleCode",
                totalEvents: { $sum: 1 },
                latestEvent: { $max: "$createdAt" }
            }
        },
        { $sort: { totalEvents: -1 } }
    ]);

    const blockedEventCounts = await RiskEvent.aggregate([
        {
            $match: {
                $or: [
                    { eventType: /BLOCK/i },
                    { action: /BLOCK/i },
                    { status: /BLOCK/i },
                    { outcome: /BLOCK/i }
                ]
            }
        },
        {
            $group: {
                _id: "$ruleCode",
                blockedCount: { $sum: 1 },
                latestBlockedEvent: { $max: "$createdAt" }
            }
        },
        { $sort: { blockedCount: -1 } }
    ]);

    const alertRuleCounts = await Alert.aggregate([
        { $unwind: { path: "$triggeredRules", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: {
                    $ifNull: [
                        "$triggeredRules.ruleCode",
                        {
                            $ifNull: [
                                "$triggeredRules.code",
                                "$triggeredRules"
                            ]
                        }
                    ]
                },
                alertCount: { $sum: 1 },
                latestAlert: { $max: "$createdAt" }
            }
        },
        { $sort: { alertCount: -1 } }
    ]);

    const recentRiskEvents = await RiskEvent.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    const recentAlerts = await Alert.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    const eventCountMap = {};
    const blockedCountMap = {};
    const alertCountMap = {};

    riskEventCounts.forEach((item) => {
        if (item._id) {
            eventCountMap[item._id] = {
                totalEvents: item.totalEvents,
                latestEvent: item.latestEvent
            };
        }
    });

    blockedEventCounts.forEach((item) => {
        if (item._id) {
            blockedCountMap[item._id] = {
                blockedCount: item.blockedCount,
                latestBlockedEvent: item.latestBlockedEvent
            };
        }
    });

    alertRuleCounts.forEach((item) => {
        if (item._id) {
            alertCountMap[item._id] = {
                alertCount: item.alertCount,
                latestAlert: item.latestAlert
            };
        }
    });

    const ruleSummary = rules.map((rule) => {
        const ruleCode = rule.ruleCode;

        return {
            ruleCode,
            ruleName: rule.ruleName,
            description: rule.description,
            tier: rule.tier,
            severity: rule.severity,
            action: rule.action,
            enabled: rule.enabled,
            riskWeight: rule.riskWeight,
            parameters: rule.parameters,

            activity: {
                totalEvents: eventCountMap[ruleCode]?.totalEvents || 0,
                blockedCount: blockedCountMap[ruleCode]?.blockedCount || 0,
                alertCount: alertCountMap[ruleCode]?.alertCount || 0,
                latestEvent: eventCountMap[ruleCode]?.latestEvent || null,
                latestBlockedEvent:
                    blockedCountMap[ruleCode]?.latestBlockedEvent || null,
                latestAlert: alertCountMap[ruleCode]?.latestAlert || null
            }
        };
    });

    return {
        generatedAt: new Date(),

        totals: {
            totalRules: rules.length,
            enabledRules: rules.filter((rule) => rule.enabled).length,
            disabledRules: rules.filter((rule) => !rule.enabled).length,
            totalRiskEvents: riskEventCounts.reduce(
                (sum, item) => sum + item.totalEvents,
                0
            ),
            totalBlockedEvents: blockedEventCounts.reduce(
                (sum, item) => sum + item.blockedCount,
                0
            ),
            totalAlertRuleTriggers: alertRuleCounts.reduce(
                (sum, item) => sum + item.alertCount,
                0
            )
        },

        ruleSummary,

        topTriggeredRules: riskEventCounts.slice(0, 10),
        topBlockedRules: blockedEventCounts.slice(0, 10),
        topAlertRules: alertRuleCounts.slice(0, 10),

        recentRiskEvents: recentRiskEvents.map((event) => ({
            ruleCode: event.ruleCode,
            eventType: event.eventType,
            action: event.action,
            reason: event.reason,
            severity: event.severity,
            traderId: event.traderId,
            stockSymbol: event.stockSymbol,
            createdAt: event.createdAt
        })),

        recentAlerts: recentAlerts.map((alert) => ({
            traderId: alert.traderId,
            stockSymbol: alert.stockSymbol,
            severity: alert.severity,
            status: alert.status,
            riskScore: alert.riskScore,
            reason: alert.reason,
            triggeredRules: alert.triggeredRules,
            createdAt: alert.createdAt
        }))
    };
};

module.exports = {
    collectDailyRiskReportData,
    collectRiskAssistantData,
    collectRuleTuningData
};