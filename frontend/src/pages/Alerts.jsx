import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAlerts, getMyAssignedAlerts } from "../api/api";

import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const getInitialFilters = (assignedToMe) => ({
    severity: "",
    status: "",
    priority: "",
    assignment: assignedToMe ? "ME" : "",
    stockSymbol: "",
    traderId: ""
});

const getPriorityClass = (priority) => {
    if (priority === "CRITICAL") {
        return "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200";
    }

    if (priority === "HIGH") {
        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    }

    if (priority === "MEDIUM") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    }

    return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300";
};

const Alerts = ({ assignedToMe = false }) => {
    const [alerts, setAlerts] = useState([]);
    const [filters, setFilters] = useState(() => getInitialFilters(assignedToMe));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAlerts = async (appliedFilters = {}) => {
        try {
            setLoading(true);

            const cleanedFilters = {};

            Object.keys(appliedFilters).forEach((key) => {
                if (appliedFilters[key] && key !== "assignment") {
                    cleanedFilters[key] = appliedFilters[key];
                }
            });

            if (!assignedToMe && appliedFilters.assignment) {
                const assignmentMap = {
                    ASSIGNED: "assigned",
                    UNASSIGNED: "unassigned",
                    ME: "me"
                };

                cleanedFilters.assignedTo = assignmentMap[appliedFilters.assignment];
            }

            const response = assignedToMe
                ? await getMyAssignedAlerts(cleanedFilters)
                : await getAlerts(cleanedFilters);

            setAlerts(response.data.data || []);
            setError("");
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to load alerts");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAlerts(getInitialFilters(assignedToMe));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignedToMe]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((currentFilters) => ({
            ...currentFilters,
            [name]: value
        }));
    };

    const handleApplyFilters = (event) => {
        event.preventDefault();
        fetchAlerts(filters);
    };

    const handleResetFilters = () => {
        const resetFilters = getInitialFilters(assignedToMe);

        setFilters(resetFilters);
        fetchAlerts(resetFilters);
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
        <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {assignedToMe ? "My Alerts" : "Alerts"}
                </h1>

                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    {assignedToMe
                        ? "Work through alerts currently assigned to you."
                        : "Filter, inspect, assign, and review generated risk alerts."}
                </p>
            </div>

            <div className="mb-6 rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
                    Alert Filters
                </h2>

                <form
                    onSubmit={handleApplyFilters}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                    <select
                        name="severity"
                        value={filters.severity}
                        onChange={handleFilterChange}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                    >
                        <option value="">All severities</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                    </select>

                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                    >
                        <option value="">All statuses</option>
                        <option value="PENDING">PENDING</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="ESCALATED">ESCALATED</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                    </select>

                    <select
                        name="priority"
                        value={filters.priority}
                        onChange={handleFilterChange}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                    >
                        <option value="">All priorities</option>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                    </select>

                    {!assignedToMe && (
                        <select
                            name="assignment"
                            value={filters.assignment}
                            onChange={handleFilterChange}
                            className="rounded-lg border border-slate-300 px-3 py-2"
                        >
                            <option value="">All assignments</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="UNASSIGNED">Unassigned</option>
                            <option value="ME">Assigned to me</option>
                        </select>
                    )}

                    <input
                        type="text"
                        name="stockSymbol"
                        value={filters.stockSymbol}
                        onChange={handleFilterChange}
                        placeholder="Stock symbol"
                        className="rounded-lg border border-slate-300 px-3 py-2 uppercase"
                    />

                    <input
                        type="text"
                        name="traderId"
                        value={filters.traderId}
                        onChange={handleFilterChange}
                        placeholder="Trader ID"
                        className="rounded-lg border border-slate-300 px-3 py-2"
                    />

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                        >
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 dark:text-slate-200"
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
                <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Trader</th>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4">Alert Type</th>
                                    <th className="px-5 py-4">Severity</th>
                                    <th className="px-5 py-4">Priority</th>
                                    <th className="px-5 py-4">Assigned To</th>
                                    <th className="px-5 py-4">Risk Score</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Created</th>
                                    <th className="px-5 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {alerts.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-6 text-center text-slate-500" colSpan="10">
                                            No alerts found.
                                        </td>
                                    </tr>
                                ) : (
                                    alerts.map((alert) => {
                                        const priority = alert.priority || alert.severity || "MEDIUM";

                                        return (
                                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/60" key={alert._id}>
                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-slate-900 dark:text-white">
                                                        {alert.traderName}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {alert.traderId}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 font-semibold">{alert.stockSymbol}</td>
                                                <td className="px-5 py-4">{alert.alertType}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getSeverityClass(alert.severity)}`}>
                                                        {alert.severity}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityClass(priority)}`}>
                                                        {priority}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {alert.assignedToName ? (
                                                        <>
                                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                                {alert.assignedToName}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {alert.assignedToEmail}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-500">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 font-semibold">{alert.riskScore}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(alert.status)}`}>
                                                        {alert.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-slate-500">
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
                                        );
                                    })
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
