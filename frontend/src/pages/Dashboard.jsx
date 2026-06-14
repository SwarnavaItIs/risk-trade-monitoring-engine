import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

import {
    getDashboardSummary,
    getAlertsBySeverity,
    getAlertsByType,
    getTopRiskyTraders,
    getTopTradedStocks,
    getRiskTrend,
    getRuleTriggerSummary,
    getBlockedTradeSummary,
    getRecentRiskEvents
} from "../api/api";

import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";
import AlertsSeverityChart from "../components/AlertsSeverityChart";

const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-white/30 bg-white/40 p-4 shadow-xl backdrop-blur-xl">
            <p className="mb-2 font-bold text-slate-900">
                {label}
            </p>

            {payload.map((item) => (
                <p key={item.dataKey} className="text-sm text-slate-700">
                    <span className="font-semibold">
                        {item.dataKey}
                    </span>
                    {" : "}
                    <span className="font-bold">
                        {item.value}
                    </span>
                </p>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [severityData, setSeverityData] = useState([]);
    const [typeData, setTypeData] = useState([]);
    const [topRiskyTraders, setTopRiskyTraders] = useState([]);
    const [topTradedStocks, setTopTradedStocks] = useState([]);
    const [riskTrend, setRiskTrend] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [ruleTriggerSummary, setRuleTriggerSummary] = useState([]);
    const [blockedTradeSummary, setBlockedTradeSummary] = useState(null);
    const [recentRiskEvents, setRecentRiskEvents] = useState([]);

    const [trendTooltipPosition, setTrendTooltipPosition] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [
                summaryResponse,
                severityResponse,
                typeResponse,
                riskyTradersResponse,
                tradedStocksResponse,
                trendResponse,
                ruleTriggerResponse,
                blockedTradeResponse,
                recentEventsResponse
            ] = await Promise.all([
                getDashboardSummary(),
                getAlertsBySeverity(),
                getAlertsByType(),
                getTopRiskyTraders(),
                getTopTradedStocks(),
                getRiskTrend(),
                getRuleTriggerSummary(),
                getBlockedTradeSummary(),
                getRecentRiskEvents()
            ]);

            setSummary(summaryResponse.data.data);
            setSeverityData(severityResponse.data.data);
            setTypeData(typeResponse.data.data);
            setTopRiskyTraders(riskyTradersResponse.data.data);
            setTopTradedStocks(tradedStocksResponse.data.data);
            setRiskTrend(trendResponse.data.data);

            setRuleTriggerSummary(ruleTriggerResponse.data.data);
            setBlockedTradeSummary(blockedTradeResponse.data.data);
            setRecentRiskEvents(recentEventsResponse.data.data);

            setError("");
        }
        catch (err) {
            setError("Failed to load dashboard data");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDashboardData();
    }, []);

    const totalRiskEvents = ruleTriggerSummary.reduce((sum, rule) => {
        return sum + rule.count;
    }, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Dashboard
                </h1>

                <div className="mt-4 mb-8">
                    <LoadingButton text="Loading dashboard data..." />
                </div>

                <SkeletonLoader type="cards" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Dashboard
                </h1>

                <p className="mt-4 font-semibold text-red-600">
                    {error}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    Dashboard
                </h1>

                <p className="mt-2 text-slate-600">
                    Real-time risk monitoring overview and trade analytics.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">
                        Total Trades
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {summary?.totalTrades || 0}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">
                        Total Alerts
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {summary?.totalAlerts || 0}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">
                        Total Trade Value
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        ₹{(summary?.totalTradeValue || 0).toLocaleString()}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">
                        Average Risk Score
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {summary?.averageRiskScore || 0}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">
                        Blocked Trades
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-red-600">
                        {blockedTradeSummary?.totalBlockedTrades || 0}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">
                        Total Risk Events
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {totalRiskEvents}
                    </h2>
                </div>

            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">

                <AlertsSeverityChart severityData={severityData} />

                <div className="flex flex-col rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Alerts by Type
                    </h3>

                    <div className="flex flex-1 items-center">
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={typeData}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 0,
                                        bottom: 10
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="rgba(148, 163, 184, 0.35)"
                                    />

                                    <XAxis
                                        dataKey="alertType"
                                        interval={0}
                                        height={55}
                                        tickMargin={10}
                                        tick={{
                                            fontSize: 10,
                                            fill: "#94a3b8"
                                        }}
                                        tickFormatter={(value) => {
                                            if (value.length > 24) {
                                                return value.slice(0, 24) + "...";
                                            }

                                            return value;
                                        }}
                                    />

                                    <YAxis
                                        tick={{
                                            fontSize: 12,
                                            fill: "#94a3b8"
                                        }}
                                    />

                                    <Tooltip
                                        cursor={false}
                                        content={<GlassTooltip />}
                                        wrapperStyle={{
                                            outline: "none",
                                            pointerEvents: "none"
                                        }}
                                    />

                                    <Bar
                                        dataKey="count"
                                        fill="#6366f1"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                    Risk Trend Over Time
                </h3>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={riskTrend}
                            onClick={(data) => {
                                if (!data || !data.activeCoordinate) {
                                    return;
                                }

                                setTrendTooltipPosition({
                                    x: Math.max(data.activeCoordinate.x - 90, 10),
                                    y: 10
                                });
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />

                            <Tooltip
                                trigger="click"
                                cursor={false}
                                content={<GlassTooltip />}
                                position={trendTooltipPosition || { x: 20, y: 10 }}
                                wrapperStyle={{
                                    outline: "none",
                                    transition: "opacity 180ms ease"
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="totalAlerts"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 7 }}
                            />

                            <Line
                                type="monotone"
                                dataKey="highRiskAlerts"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                    Rule Trigger Frequency
                </h3>

                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                    Shows how often each risk rule has blocked a trade or generated an alert.
                </p>

                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={ruleTriggerSummary.slice(0, 8)}
                            margin={{
                                top: 10,
                                right: 24,
                                left: 0,
                                bottom: 8
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(148, 163, 184, 0.35)"
                            />

                            <XAxis
                                dataKey="ruleCode"
                                interval={0}
                                height={45}
                                tickMargin={8}
                                tick={{
                                    fontSize: 10,
                                    fill: "#94a3b8"
                                }}
                                tickFormatter={(value) => {
                                    if (value.length > 18) {
                                        return value.slice(0, 18) + "...";
                                    }

                                    return value;
                                }}
                            />

                            <YAxis
                                tick={{
                                    fontSize: 12,
                                    fill: "#94a3b8"
                                }}
                            />

                            <Tooltip
                                cursor={false}
                                content={<GlassTooltip />}
                                wrapperStyle={{
                                    outline: "none",
                                    pointerEvents: "none"
                                }}
                            />

                            <Bar
                                dataKey="count"
                                fill="#ef4444"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow">
                <div className="border-b border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-900">
                        Top Blocked Rules
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-5 py-4">Rule Code</th>
                                <th className="px-5 py-4">Rule Name</th>
                                <th className="px-5 py-4">Blocked Count</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {blockedTradeSummary?.blockedByRule?.length === 0 ? (
                                <tr>
                                    <td className="px-5 py-4" colSpan="3">
                                        No blocked trades found.
                                    </td>
                                </tr>
                            ) : (
                                blockedTradeSummary?.blockedByRule?.map((rule) => (
                                    <tr key={rule.ruleCode} className="hover:bg-slate-50">
                                        <td className="px-5 py-4 font-semibold text-slate-900">
                                            {rule.ruleCode}
                                        </td>

                                        <td className="px-5 py-4">
                                            {rule.ruleName}
                                        </td>

                                        <td className="px-5 py-4 font-bold text-red-600">
                                            {rule.count}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow">
                <div className="border-b border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-900">
                        Recent Risk Events
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-5 py-4">Event Type</th>
                                <th className="px-5 py-4">Rule</th>
                                <th className="px-5 py-4">Trader</th>
                                <th className="px-5 py-4">Stock</th>
                                <th className="px-5 py-4">Severity</th>
                                <th className="px-5 py-4">Reason</th>
                                <th className="px-5 py-4">Time</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {recentRiskEvents.length === 0 ? (
                                <tr>
                                    <td className="px-5 py-4" colSpan="7">
                                        No recent risk events found.
                                    </td>
                                </tr>
                            ) : (
                                recentRiskEvents.map((event) => (
                                    <tr key={event._id} className="hover:bg-slate-50">
                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold ${event.eventType === "BLOCKED_TRADE"
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-blue-100 text-blue-700"
                                                    }`}
                                            >
                                                {event.eventType}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900">
                                                {event.ruleCode}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {event.ruleName}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-900">
                                                {event.traderName}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {event.traderId}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 font-semibold">
                                            {event.stockSymbol}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold ${event.severity === "HIGH"
                                                    ? "bg-red-100 text-red-700"
                                                    : event.severity === "MEDIUM"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-green-100 text-green-700"
                                                    }`}
                                            >
                                                {event.severity}
                                            </span>
                                        </td>

                                        <td className="max-w-md px-5 py-4 text-slate-600">
                                            {event.reason}
                                        </td>

                                        <td className="px-5 py-4 text-slate-500">
                                            {new Date(event.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="overflow-hidden rounded-2xl bg-white shadow">
                    <div className="border-b border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            Top Risky Traders
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-5 py-4">Trader</th>
                                    <th className="px-5 py-4">Alerts</th>
                                    <th className="px-5 py-4">High Risk</th>
                                    <th className="px-5 py-4">Avg Score</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {topRiskyTraders.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-4" colSpan="4">
                                            No risky traders found.
                                        </td>
                                    </tr>
                                ) : (
                                    topRiskyTraders.map((trader) => (
                                        <tr key={trader.traderId} className="hover:bg-slate-50">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900">
                                                    {trader.traderName}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {trader.traderId}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">{trader.totalAlerts}</td>
                                            <td className="px-5 py-4">{trader.highRiskAlerts}</td>
                                            <td className="px-5 py-4 font-semibold">
                                                {trader.averageRiskScore}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl bg-white shadow">
                    <div className="border-b border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-900">
                            Top Traded Stocks
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4">Trades</th>
                                    <th className="px-5 py-4">Quantity</th>
                                    <th className="px-5 py-4">Value</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {topTradedStocks.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-4" colSpan="4">
                                            No traded stocks found.
                                        </td>
                                    </tr>
                                ) : (
                                    topTradedStocks.map((stock) => (
                                        <tr key={stock.stockSymbol} className="hover:bg-slate-50">
                                            <td className="px-5 py-4 font-semibold text-slate-900">
                                                {stock.stockSymbol}
                                            </td>
                                            <td className="px-5 py-4">{stock.totalTrades}</td>
                                            <td className="px-5 py-4">{stock.totalQuantity}</td>
                                            <td className="px-5 py-4 font-semibold">
                                                ₹{stock.totalTradeValue?.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
