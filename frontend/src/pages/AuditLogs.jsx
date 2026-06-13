import { useEffect, useState } from "react";

import { getAdminAuditLogs } from "../api/api";
import LoadingButton from "../components/LoadingButton";

const initialFilters = {
    action: "",
    actorRole: "",
    entityType: ""
};

const formatLabel = (value = "") => {
    return value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = async (appliedFilters = filters, requestedPage = page) => {
        try {
            setLoading(true);

            const response = await getAdminAuditLogs({
                ...appliedFilters,
                page: requestedPage,
                limit: 20
            });

            setLogs(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
            setError("");
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to load audit logs");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchLogs(initialFilters, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((currentFilters) => ({
            ...currentFilters,
            [name]: value
        }));
    };

    const handleApplyFilters = (event) => {
        event.preventDefault();
        setPage(1);
        fetchLogs(filters, 1);
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        setPage(1);
        fetchLogs(initialFilters, 1);
    };

    const changePage = (nextPage) => {
        setPage(nextPage);
        fetchLogs(filters, nextPage);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Audit Logs
                </h1>

                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Review important actions performed by admins and analysts.
                </p>
            </div>

            <form
                onSubmit={handleApplyFilters}
                className="mb-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow dark:bg-slate-900 md:grid-cols-4"
            >
                <select
                    name="action"
                    value={filters.action}
                    onChange={handleFilterChange}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                >
                    <option value="">All actions</option>
                    <option value="RISK_RULE_UPDATED">Risk rule updated</option>
                    <option value="ALERT_STATUS_UPDATED">Alert status updated</option>
                    <option value="ALERT_ASSIGNED">Alert assigned</option>
                    <option value="ALERT_COMMENT_ADDED">Alert comment added</option>
                    <option value="ALERT_PRIORITY_UPDATED">Alert priority updated</option>
                    <option value="USER_ROLE_UPDATED">User role updated</option>
                    <option value="CSV_TRADES_UPLOADED">CSV trades uploaded</option>
                </select>

                <select
                    name="actorRole"
                    value={filters.actorRole}
                    onChange={handleFilterChange}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                >
                    <option value="">All actor roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="ANALYST">Analyst</option>
                </select>

                <select
                    name="entityType"
                    value={filters.entityType}
                    onChange={handleFilterChange}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                >
                    <option value="">All targets</option>
                    <option value="RISK_RULE">Risk rule</option>
                    <option value="ALERT">Alert</option>
                    <option value="USER">User</option>
                    <option value="CSV_UPLOAD">CSV upload</option>
                </select>

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

            {loading && <LoadingButton text="Loading audit logs..." />}
            {error && <p className="font-semibold text-red-600">{error}</p>}

            {!loading && !error && (
                <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Time</th>
                                    <th className="px-5 py-4">Actor</th>
                                    <th className="px-5 py-4">Action</th>
                                    <th className="px-5 py-4">Target</th>
                                    <th className="px-5 py-4">Changes / Details</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No audit logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log._id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {log.actor.name}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {log.actor.role} | {log.actor.email}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                    {formatLabel(log.action)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {log.target.label || log.target.entityId}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatLabel(log.target.entityType)}
                                                </div>
                                            </td>

                                            <td className="max-w-lg px-5 py-4">
                                                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-200">
                                                    {JSON.stringify(
                                                        Object.keys(log.changes || {}).length > 0
                                                            ? log.changes
                                                            : log.metadata,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => changePage(page - 1)}
                            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-40 dark:text-slate-200"
                        >
                            Previous
                        </button>

                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => changePage(page + 1)}
                            className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 disabled:opacity-40 dark:text-slate-200"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
