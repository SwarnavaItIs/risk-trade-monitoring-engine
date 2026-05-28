import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAlerts } from "../api/api";

import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const initialFilters = {
    severity: "",
    status: "",
    stockSymbol: "",
    traderId: ""
};

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [filters, setFilters] = useState(initialFilters);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAlerts = async (appliedFilters = {}) => {
        try {
            setLoading(true);

            const cleanedFilters = {};

            Object.keys(appliedFilters).forEach((key) => {
                if (appliedFilters[key]) {
                    cleanedFilters[key] = appliedFilters[key];
                }
            });

            const response = await getAlerts(cleanedFilters);

            setAlerts(response.data.data);
            setError("");
        }
        catch (err) {
            setError("Failed to load alerts");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleApplyFilters = (event) => {
        event.preventDefault();
        fetchAlerts(filters);
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        fetchAlerts();
    };

    const getSeverityClass = (severity) => {
        if (severity === "HIGH") {
            return "bg-red-100 text-red-700";
        }

        if (severity === "MEDIUM") {
            return "bg-amber-100 text-amber-700";
        }

        return "bg-green-100 text-green-700";
    };

    const getStatusClass = (status) => {
        if (status === "ESCALATED") {
            return "bg-red-100 text-red-700";
        }

        if (status === "UNDER_REVIEW") {
            return "bg-blue-100 text-blue-700";
        }

        if (status === "RESOLVED") {
            return "bg-green-100 text-green-700";
        }

        if (status === "FALSE_POSITIVE") {
            return "bg-slate-200 text-slate-700";
        }

        return "bg-amber-100 text-amber-700";
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    Alerts
                </h1>

                <p className="mt-2 text-slate-600">
                    Filter, inspect, and review generated risk alerts.
                </p>
            </div>

            <div className="mb-6 rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                    Alert Filters
                </h2>

                <form
                    onSubmit={handleApplyFilters}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Severity
                        </label>

                        <select
                            name="severity"
                            value={filters.severity}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="">All</option>
                            <option value="HIGH">HIGH</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="LOW">LOW</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Status
                        </label>

                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="">All</option>
                            <option value="PENDING">PENDING</option>
                            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                            <option value="ESCALATED">ESCALATED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Stock Symbol
                        </label>

                        <input
                            type="text"
                            name="stockSymbol"
                            value={filters.stockSymbol}
                            onChange={handleFilterChange}
                            placeholder="PAYTM"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Trader ID
                        </label>

                        <input
                            type="text"
                            name="traderId"
                            value={filters.traderId}
                            onChange={handleFilterChange}
                            placeholder="T301"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-indigo-700"
                        >
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {loading && (
                <>
                    <div className="mb-8">
                        <LoadingButton text="Loading alerts..." />
                    </div>

                    <SkeletonLoader type="table" />
                </>
            )}

            {error && <p className="font-semibold text-red-600">{error}</p>}

            {!loading && !error && (
                <div className="overflow-hidden rounded-2xl bg-white shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-5 py-4">Trader</th>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4">Alert Type</th>
                                    <th className="px-5 py-4">Severity</th>
                                    <th className="px-5 py-4">Risk Score</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Created</th>
                                    <th className="px-5 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {alerts.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-4" colSpan="8">
                                            No alerts found.
                                        </td>
                                    </tr>
                                ) : (
                                    alerts.map((alert) => (
                                        <tr className="hover:bg-slate-50" key={alert._id}>
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-slate-900">
                                                    {alert.traderName}
                                                </div>

                                                <div className="text-xs text-slate-500">
                                                    {alert.traderId}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 font-semibold">
                                                {alert.stockSymbol}
                                            </td>

                                            <td className="px-5 py-4">
                                                {alert.alertType}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${getSeverityClass(alert.severity)}`}
                                                >
                                                    {alert.severity}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 font-semibold">
                                                {alert.riskScore}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(alert.status)}`}
                                                >
                                                    {alert.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-slate-500">
                                                {new Date(alert.createdAt).toLocaleString()}
                                            </td>

                                            <td className="px-5 py-4">
                                                <Link
                                                    className="font-semibold text-blue-600 hover:underline"
                                                    to={`/alerts/${alert._id}`}
                                                >
                                                    Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Alerts;