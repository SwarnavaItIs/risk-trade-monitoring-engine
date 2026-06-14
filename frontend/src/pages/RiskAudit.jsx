import { useEffect, useState } from "react";

import {
    getRiskAuditResults,
    runRiskAudit
} from "../api/api";
import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const ruleLabels = {
    R11_CUMULATIVE_PORTFOLIO_CONCENTRATION: "R11 Portfolio Concentration",
    R12_AGGREGATE_CAPITAL_BURN_RATE: "R12 Capital Burn Rate"
};

const severityClasses = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
};

const formatNotional = (value) => {
    return Number(value || 0).toLocaleString(undefined, {
        maximumFractionDigits: 2
    });
};

const RiskAudit = () => {
    const [results, setResults] = useState([]);
    const [ruleCode, setRuleCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchResults = async (selectedRuleCode = ruleCode) => {
        try {
            setLoading(true);

            const response = await getRiskAuditResults({
                ruleCode: selectedRuleCode || undefined
            });

            setResults(response.data.data || []);
            setError("");
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to load risk audit results");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchResults("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRunAudit = async () => {
        try {
            setRunning(true);
            setMessage("");
            setError("");

            const response = await runRiskAudit();
            const findings = response.data.data || [];

            setMessage(`Risk audit completed with ${findings.length} finding${findings.length === 1 ? "" : "s"}.`);
            await fetchResults(ruleCode);
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to run risk audit");
        }
        finally {
            setRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Risk Audit
                    </h1>

                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Run post-trade concentration and capital burn checks against today&apos;s trades.
                    </p>
                </div>

                {running ? (
                    <LoadingButton text="Running audit..." />
                ) : (
                    <button
                        type="button"
                        onClick={handleRunAudit}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow transition hover:bg-indigo-700"
                    >
                        Run Audit
                    </button>
                )}
            </div>

            {message && (
                <p className="mb-6 rounded-xl bg-emerald-100 p-4 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    {message}
                </p>
            )}

            {error && (
                <p className="mb-6 rounded-xl bg-red-100 p-4 font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-300">
                    {error}
                </p>
            )}

            <section className="mb-6 rounded-2xl bg-white p-5 shadow dark:bg-slate-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Finding type
                        </label>

                        <select
                            value={ruleCode}
                            onChange={(event) => setRuleCode(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        >
                            <option value="">All R11 / R12 findings</option>
                            {Object.entries(ruleLabels).map(([code, label]) => (
                                <option key={code} value={code}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchResults(ruleCode)}
                        disabled={loading}
                        className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Apply Filter
                    </button>
                </div>
            </section>

            {loading ? (
                <SkeletonLoader type="table" />
            ) : (
                <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Time</th>
                                    <th className="px-5 py-4">Rule</th>
                                    <th className="px-5 py-4">Trader</th>
                                    <th className="px-5 py-4">Symbol</th>
                                    <th className="px-5 py-4">Notional</th>
                                    <th className="px-5 py-4">Finding</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                                            No post-trade audit findings yet.
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((result) => (
                                        <tr key={result._id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                                                {new Date(result.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${severityClasses[result.severity] || severityClasses.MEDIUM}`}>
                                                    {result.ruleCode?.split("_")[0]}
                                                </span>
                                                <p className="mt-2 max-w-52 font-semibold text-slate-900 dark:text-white">
                                                    {result.ruleName}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {result.traderName || result.traderId || "Global"}
                                                </p>
                                                {result.traderId && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {result.traderId}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                                                {result.stockSymbol || "All symbols"}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 dark:text-white">
                                                {formatNotional(result.tradeValue)}
                                            </td>
                                            <td className="max-w-xl px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {result.reason}
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

export default RiskAudit;
