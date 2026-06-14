import { useEffect, useState } from "react";

import { getEngineHealth } from "../api/api";
import SkeletonLoader from "../components/SkeletonLoader";

const StatusBadge = ({ healthy, healthyLabel, unhealthyLabel }) => {
    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
                healthy
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
            }`}
        >
            {healthy ? healthyLabel : unhealthyLabel}
        </span>
    );
};

const DetailRow = ({ label, value }) => {
    return (
        <div className="flex items-start justify-between gap-4 border-t border-slate-100 py-3 first:border-t-0 dark:border-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
            <span className="break-all text-right text-sm font-semibold text-slate-900 dark:text-white">
                {value}
            </span>
        </div>
    );
};

const SystemHealth = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchHealth = async () => {
        try {
            setLoading(true);

            const response = await getEngineHealth();

            setHealth(response.data.data);
            setError("");
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to load system health");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchHealth();
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        System Health
                    </h1>

                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Live engine availability and the fallbacks protecting trade evaluation.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchHealth}
                    disabled={loading}
                    className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Refreshing..." : "Refresh status"}
                </button>
            </div>

            {loading && !health && <SkeletonLoader />}
            {error && <p className="mb-6 font-semibold text-red-600">{error}</p>}

            {health && (
                <>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        <section className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Redis
                                </h2>

                                <StatusBadge
                                    healthy={health.redis.connected}
                                    healthyLabel="Connected"
                                    unhealthyLabel="Fallback active"
                                />
                            </div>

                            <DetailRow label="Enabled" value={health.redis.enabled ? "Yes" : "No"} />
                            <DetailRow label="URL configured" value={health.redis.urlConfigured ? "Yes" : "No"} />
                            <DetailRow label="Ready for commands" value={health.redis.connected ? "Yes" : "No"} />
                        </section>

                        <section className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    C++ Risk Engine
                                </h2>

                                <StatusBadge
                                    healthy={health.cppEngine.available}
                                    healthyLabel="Available"
                                    unhealthyLabel="Unavailable"
                                />
                            </div>

                            <DetailRow label="Platform" value={health.cppEngine.platform} />
                            <DetailRow label="Executable path" value={health.cppEngine.path} />
                        </section>

                        <section className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Market Data
                                </h2>

                                <StatusBadge
                                    healthy={health.marketData.configured}
                                    healthyLabel="Configured"
                                    unhealthyLabel="Static fallback"
                                />
                            </div>

                            <DetailRow label="Provider" value={health.marketData.provider} />
                            <DetailRow label="External provider configured" value={health.marketData.configured ? "Yes" : "No"} />
                        </section>
                    </div>

                    <section className="mt-6 rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Fallback Strategy
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Trade evaluation continues through these paths when an optional engine is unavailable.
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {Object.entries(health.fallbacks).map(([name, description]) => (
                                <div
                                    key={name}
                                    className="rounded-xl bg-slate-100 p-4 dark:bg-slate-950"
                                >
                                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                        {name.replace("Fallback", "")}
                                    </p>

                                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default SystemHealth;
