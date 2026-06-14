import { useEffect, useState } from "react";
import { getRiskRules, updateRiskRule } from "../api/api";

import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const tierOptions = ["", "PRE_TRADE", "BEHAVIORAL", "POST_TRADE"];
const actionOptions = ["BLOCK", "ALERT", "AUDIT"];
const severityOptions = ["LOW", "MEDIUM", "HIGH"];

const RiskRules = () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    const isAdmin = loggedInUser?.role === "ADMIN";

    const [rules, setRules] = useState([]);
    const [filters, setFilters] = useState({
        tier: "",
        enabled: "",
        action: ""
    });

    const [editingRuleId, setEditingRuleId] = useState(null);
    const [editData, setEditData] = useState({
        ruleName: "",
        description: "",
        enabled: true,
        severity: "MEDIUM",
        riskWeight: 0,
        action: "ALERT",
        parametersText: "{}"
    });

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchRules = async (appliedFilters = filters) => {
        try {
            setLoading(true);
            setError("");

            const cleanedFilters = {};

            Object.keys(appliedFilters).forEach((key) => {
                if (appliedFilters[key] !== "") {
                    cleanedFilters[key] = appliedFilters[key];
                }
            });

            const response = await getRiskRules(cleanedFilters);

            setRules(response.data.data);
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to load risk rules";

            setError(message);
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRules();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        fetchRules(filters);
    };

    const handleResetFilters = () => {
        const resetFilters = {
            tier: "",
            enabled: "",
            action: ""
        };

        setFilters(resetFilters);
        fetchRules(resetFilters);
    };

    const startEditing = (rule) => {
        setEditingRuleId(rule._id);
        setMessage("");
        setError("");

        setEditData({
            ruleName: rule.ruleName,
            description: rule.description,
            enabled: rule.enabled,
            severity: rule.severity,
            riskWeight: rule.riskWeight,
            action: rule.action,
            parametersText: JSON.stringify(rule.parameters || {}, null, 4)
        });
    };

    const cancelEditing = () => {
        setEditingRuleId(null);
        setMessage("");
        setError("");
    };

    const handleEditChange = (event) => {
        const { name, value, type, checked } = event.target;

        setEditData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleUpdateRule = async (ruleId) => {
        try {
            setUpdating(true);
            setError("");
            setMessage("");

            let parsedParameters;

            try {
                parsedParameters = JSON.parse(editData.parametersText);
            }
            catch {
                setError("Parameters must be valid JSON.");
                return;
            }

            const payload = {
                ruleName: editData.ruleName,
                description: editData.description,
                enabled: editData.enabled,
                severity: editData.severity,
                riskWeight: Number(editData.riskWeight),
                action: editData.action,
                parameters: parsedParameters
            };

            await updateRiskRule(ruleId, payload);

            setMessage("Risk rule updated successfully.");
            setEditingRuleId(null);

            await fetchRules(filters);
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to update risk rule";

            setError(message);
            console.log(err);
        }
        finally {
            setUpdating(false);
        }
    };

    const getTierBadgeClass = (tier) => {
        if (tier === "PRE_TRADE") {
            return "bg-red-100 text-red-700";
        }

        if (tier === "BEHAVIORAL") {
            return "bg-amber-100 text-amber-700";
        }

        return "bg-green-100 text-green-700";
    };

    const getActionBadgeClass = (action) => {
        if (action === "BLOCK") {
            return "bg-red-100 text-red-700";
        }

        if (action === "ALERT") {
            return "bg-blue-100 text-blue-700";
        }

        return "bg-purple-100 text-purple-700";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Risk Rules
                    </h1>

                    <p className="mt-2 text-slate-600">
                        Loading dynamic risk rule configuration...
                    </p>
                </div>

                <div className="mb-8">
                    <LoadingButton text="Loading risk rules..." />
                </div>

                <SkeletonLoader type="table" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    Risk Rules
                </h1>

                <p className="mt-2 text-slate-600">
                    Manage configurable pre-trade, behavioral, and post-trade risk controls.
                </p>
            </div>

            {!isAdmin && (
                <div className="mb-6 rounded-lg bg-amber-50 p-4 font-semibold text-amber-700">
                    You are logged in as ANALYST. You can view rules, but only ADMIN users can update them.
                </div>
            )}

            {message && (
                <div className="mb-6 rounded-lg bg-green-50 p-4 font-semibold text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            <div className="mb-6 rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                    Filters
                </h2>

                <form
                    onSubmit={handleApplyFilters}
                    className="grid grid-cols-1 gap-4 md:grid-cols-4"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Tier
                        </label>

                        <select
                            name="tier"
                            value={filters.tier}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            {tierOptions.map((tier) => (
                                <option key={tier} value={tier}>
                                    {tier || "All"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Enabled
                        </label>

                        <select
                            name="enabled"
                            value={filters.enabled}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="">All</option>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Action
                        </label>

                        <select
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="">All</option>
                            {actionOptions.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>
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

            <div className="space-y-5">
                {rules.length === 0 ? (
                    <div className="rounded-2xl bg-white p-6 shadow">
                        <p className="text-slate-600">
                            No risk rules found.
                        </p>
                    </div>
                ) : (
                    rules.map((rule) => (
                        <div
                            key={rule._id}
                            className="rounded-2xl bg-white p-6 shadow"
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {rule.ruleName}
                                        </h2>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${getTierBadgeClass(rule.tier)}`}
                                        >
                                            {rule.tier}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${getActionBadgeClass(rule.action)}`}
                                        >
                                            {rule.action}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${rule.enabled
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-slate-200 text-slate-700"
                                                }`}
                                        >
                                            {rule.enabled ? "ENABLED" : "DISABLED"}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm font-semibold text-slate-500">
                                        {rule.ruleCode}
                                    </p>

                                    <div className="mt-4 max-w-4xl rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                            What this rule does
                                        </p>

                                        <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
                                            {rule.description}
                                        </p>
                                    </div>
                                </div>

                                {isAdmin && editingRuleId !== rule._id && (
                                    <button
                                        type="button"
                                        onClick={() => startEditing(rule)}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-indigo-700"
                                    >
                                        Edit Rule
                                    </button>
                                )}
                            </div>

                            {editingRuleId !== rule._id && (
                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-sm text-slate-500">
                                            Severity
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900">
                                            {rule.severity}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-sm text-slate-500">
                                            Risk Weight
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900">
                                            {rule.riskWeight}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-sm text-slate-500">
                                            Category
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900">
                                            {rule.category}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4 md:col-span-3">
                                        <p className="mb-2 text-sm text-slate-500">
                                            Parameters
                                        </p>

                                        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                                            {JSON.stringify(rule.parameters, null, 4)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {editingRuleId === rule._id && (
                                <div className="mt-6 rounded-xl bg-slate-50 p-5">
                                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                                        Edit Rule
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Rule Name
                                            </label>

                                            <input
                                                type="text"
                                                name="ruleName"
                                                value={editData.ruleName}
                                                onChange={handleEditChange}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Risk Weight
                                            </label>

                                            <input
                                                type="number"
                                                name="riskWeight"
                                                value={editData.riskWeight}
                                                onChange={handleEditChange}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Severity
                                            </label>

                                            <select
                                                name="severity"
                                                value={editData.severity}
                                                onChange={handleEditChange}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                                            >
                                                {severityOptions.map((severity) => (
                                                    <option key={severity} value={severity}>
                                                        {severity}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Action
                                            </label>

                                            <select
                                                name="action"
                                                value={editData.action}
                                                onChange={handleEditChange}
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                                            >
                                                {actionOptions.map((action) => (
                                                    <option key={action} value={action}>
                                                        {action}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Description shown to admins and analysts
                                            </label>

                                            <textarea
                                                name="description"
                                                value={editData.description}
                                                onChange={handleEditChange}
                                                rows="5"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Parameters JSON
                                            </label>

                                            <textarea
                                                name="parametersText"
                                                value={editData.parametersText}
                                                onChange={handleEditChange}
                                                rows="8"
                                                className="w-full rounded-lg border border-slate-300 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="enabled"
                                                checked={editData.enabled}
                                                onChange={handleEditChange}
                                                className="size-4"
                                            />

                                            <label className="text-sm font-medium text-slate-700">
                                                Rule Enabled
                                            </label>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-white"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleUpdateRule(rule._id)}
                                                disabled={updating}
                                                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {updating ? "Saving..." : "Save Changes"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RiskRules;
