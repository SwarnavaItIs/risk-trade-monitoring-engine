import { useEffect, useState } from "react";
import { getDashboardSummary } from "../api/api";
import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboardSummary = async () => {
        try {
            setLoading(true);
            const response = await getDashboardSummary();
            setSummary(response.data.data);
            setError("");
        }
        catch (err) {
            setError("Failed to load dashboard summary");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardSummary();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
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
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="mt-2 font-semibold text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="mt-2 text-slate-600">
                    Risk summary and monitoring overview.
                </p>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">Total Trades</p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {summary?.totalTrades || 0}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">Total Alerts</p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {summary?.totalAlerts || 0}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">Total Trade Value</p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        ₹{(summary?.totalTradeValue || 0).toLocaleString()}
                    </h2>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <p className="text-sm font-medium text-slate-500">Average Risk Score</p>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">
                        {summary?.averageRiskScore || 0}
                    </h2>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Alerts By Severity
                    </h3>

                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">High</span>
                            <strong className="text-red-600">
                                {summary?.alertsBySeverity?.high || 0}
                            </strong>
                        </div>

                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">Medium</span>
                            <strong className="text-amber-600">
                                {summary?.alertsBySeverity?.medium || 0}
                            </strong>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-600">Low</span>
                            <strong className="text-green-600">
                                {summary?.alertsBySeverity?.low || 0}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Alerts By Status
                    </h3>

                    <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">Pending</span>
                            <strong>{summary?.alertsByStatus?.pending || 0}</strong>
                        </div>

                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">Under Review</span>
                            <strong>{summary?.alertsByStatus?.underReview || 0}</strong>
                        </div>

                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">Escalated</span>
                            <strong>{summary?.alertsByStatus?.escalated || 0}</strong>
                        </div>

                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-600">Resolved</span>
                            <strong>{summary?.alertsByStatus?.resolved || 0}</strong>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-600">False Positive</span>
                            <strong>{summary?.alertsByStatus?.falsePositive || 0}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;