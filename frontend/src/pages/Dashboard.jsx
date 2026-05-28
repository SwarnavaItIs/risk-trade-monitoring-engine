import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
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
    getRiskTrend
} from "../api/api";

import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const severityColors = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444"
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

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [
                summaryResponse,
                severityResponse,
                typeResponse,
                riskyTradersResponse,
                tradedStocksResponse,
                trendResponse
            ] = await Promise.all([
                getDashboardSummary(),
                getAlertsBySeverity(),
                getAlertsByType(),
                getTopRiskyTraders(),
                getTopTradedStocks(),
                getRiskTrend()
            ]);

            setSummary(summaryResponse.data.data);
            setSeverityData(severityResponse.data.data);
            setTypeData(typeResponse.data.data);
            setTopRiskyTraders(riskyTradersResponse.data.data);
            setTopTradedStocks(tradedStocksResponse.data.data);
            setRiskTrend(trendResponse.data.data);

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
        fetchDashboardData();
    }, []);

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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
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
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Alerts by Severity
                    </h3>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    dataKey="count"
                                    nameKey="severity"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    label
                                >
                                    {severityData.map((entry) => (
                                        <Cell
                                            key={entry.severity}
                                            fill={severityColors[entry.severity] || "#6366f1"}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Alerts by Type
                    </h3>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="alertType" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                    Risk Trend Over Time
                </h3>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={riskTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="totalAlerts"
                                stroke="#6366f1"
                                strokeWidth={3}
                            />
                            <Line
                                type="monotone"
                                dataKey="highRiskAlerts"
                                stroke="#ef4444"
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
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