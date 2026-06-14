import { useEffect, useState } from "react";
import { createTrade, getTrades } from "../api/api";

import DateTimeInput from "../components/DateTimeInput";
import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";
import { dateTimeLocalToIso } from "../utils/dateTime";

const initialFormData = {
    traderId: "",
    traderName: "",
    stockSymbol: "",
    tradeType: "BUY",
    quantity: "",
    price: "",
    tradeTime: ""
};

const Trades = () => {
    const [trades, setTrades] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [submitResult, setSubmitResult] = useState(null);

    const [blockedResult, setBlockedResult] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");

    const fetchTrades = async () => {
        try {
            setLoading(true);

            const response = await getTrades();

            setTrades(response.data.data);
            setError("");
        }
        catch (err) {
            setError("Failed to load trades");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTrades();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSubmitting(true);
            setFormError("");
            setSubmitResult(null);
            setBlockedResult(null);

            const tradePayload = {
                traderId: formData.traderId,
                traderName: formData.traderName,
                stockSymbol: formData.stockSymbol,
                tradeType: formData.tradeType,
                quantity: Number(formData.quantity),
                price: Number(formData.price)
            };

            if (formData.tradeTime) {
                tradePayload.tradeTime = dateTimeLocalToIso(formData.tradeTime);
            }

            const response = await createTrade(tradePayload);

            setSubmitResult(response.data.data);
            setFormData(initialFormData);

            await fetchTrades();
        }
        catch (err) {
            const responseData = err.response?.data;

            if (responseData?.blocked) {
                setBlockedResult(responseData);
                setFormError("");
            } else {
                const message =
                    responseData?.message ||
                    responseData?.error ||
                    "Failed to create trade";

                setFormError(message);
            }

            console.log(err);
        }
        finally {
            setSubmitting(false);
        }
    };

    const getRiskBadgeClass = (severity) => {
        if (severity === "HIGH") {
            return "bg-red-100 text-red-700";
        }

        if (severity === "MEDIUM") {
            return "bg-amber-100 text-amber-700";
        }

        return "bg-green-100 text-green-700";
    };

    const getFailedRuleSeverityClass = (severity) => {
        if (severity === "HIGH") {
            return "bg-red-100 text-red-700";
        }

        if (severity === "MEDIUM") {
            return "bg-amber-100 text-amber-700";
        }

        return "bg-green-100 text-green-700";
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    Trades
                </h1>

                <p className="mt-2 text-slate-600">
                    Add trades, run risk checks, and view all stored trades.
                </p>
            </div>

            <div className="mb-6 rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                    Add New Trade
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Trader ID
                        </label>
                        <input
                            type="text"
                            name="traderId"
                            value={formData.traderId}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            placeholder="T101"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Trader Name
                        </label>
                        <input
                            type="text"
                            name="traderName"
                            value={formData.traderName}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            placeholder="Rahul Mehta"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Stock Symbol
                        </label>
                        <input
                            type="text"
                            name="stockSymbol"
                            value={formData.stockSymbol}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-indigo-500"
                            placeholder="RELIANCE"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Trade Type
                        </label>
                        <select
                            name="tradeType"
                            value={formData.tradeType}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Quantity
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            placeholder="2000"
                            min="1"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Price
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            placeholder="2800"
                            min="1"
                            required
                        />
                    </div>

                    <DateTimeInput
                        label="Trade Time (Optional)"
                        name="tradeTime"
                        value={formData.tradeTime}
                        onChange={handleChange}
                        helperText="Choose the trade execution date and time."
                    />

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? "Adding Trade..." : "Add Trade"}
                        </button>
                    </div>
                </form>

                {formError && (
                    <p className="mt-4 font-semibold text-red-600">
                        {formError}
                    </p>
                )}

                {blockedResult && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-red-700">
                                    Trade Blocked by Pre-Trade Controls
                                </h2>

                                <p className="mt-2 text-sm text-red-600">
                                    This trade was rejected before saving because it violated one or more hard-block risk rules.
                                </p>
                            </div>

                            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                                BLOCKED
                            </span>
                        </div>

                        <div className="mt-5 space-y-4">
                            {blockedResult.failedRules?.map((rule) => (
                                <div
                                    key={rule.ruleCode}
                                    className="rounded-xl bg-white p-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-slate-900">
                                            {rule.ruleName}
                                        </h3>

                                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                            {rule.ruleCode}
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${getFailedRuleSeverityClass(rule.severity)}`}
                                        >
                                            {rule.severity}
                                        </span>

                                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                            {rule.action}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm text-slate-700">
                                        {rule.reason}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {submitting && (
                <div className="mb-6">
                    <LoadingButton text="Processing trade risk..." />
                </div>
            )}

            {submitResult && (
                <div className="mb-6 rounded-2xl bg-white p-6 shadow">
                    <h2 className="mb-4 text-xl font-bold text-slate-900">
                        Trade Accepted — Behavioral Risk Evaluation
                    </h2>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-slate-500">Risky Trade</p>
                            <p className="mt-1 font-bold text-slate-900">
                                {submitResult.riskResult.isRisky ? "Yes" : "No"}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">Risk Score</p>
                            <p className="mt-1 font-bold text-slate-900">
                                {submitResult.riskResult.riskScore}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">Severity</p>
                            <span
                                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${getRiskBadgeClass(submitResult.riskResult.severity)}`}
                            >
                                {submitResult.riskResult.severity}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-700">
                            Triggered Rules
                        </p>

                        {submitResult.riskResult.triggeredRules.length === 0 ? (
                            <p className="mt-1 text-sm text-slate-500">
                                No rules triggered.
                            </p>
                        ) : (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                {submitResult.riskResult.triggeredRules.map((rule, index) => (
                                    <li key={index}>{rule}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-700">
                            Reasons
                        </p>

                        {submitResult.riskResult.reasons.length === 0 ? (
                            <p className="mt-1 text-sm text-slate-500">
                                This trade did not trigger any risk rule.
                            </p>
                        ) : (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                {submitResult.riskResult.reasons.map((reason, index) => (
                                    <li key={index}>{reason}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {submitResult.alert && (
                        <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                            Alert generated successfully with status{" "}
                            <strong>{submitResult.alert.status}</strong>.
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                    All Trades
                </h2>
            </div>

            {loading && <SkeletonLoader type="table" />}

            {error && <p className="font-semibold text-red-600">{error}</p>}

            {!loading && !error && (
                <div className="overflow-hidden rounded-2xl bg-white shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="px-5 py-4">Trader ID</th>
                                    <th className="px-5 py-4">Trader Name</th>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4">Type</th>
                                    <th className="px-5 py-4">Quantity</th>
                                    <th className="px-5 py-4">Price</th>
                                    <th className="px-5 py-4">Trade Value</th>
                                    <th className="px-5 py-4">Trade Time</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {trades.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-4" colSpan="8">
                                            No trades found.
                                        </td>
                                    </tr>
                                ) : (
                                    trades.map((trade) => (
                                        <tr className="hover:bg-slate-50" key={trade._id}>
                                            <td className="px-5 py-4 font-medium text-slate-900">
                                                {trade.traderId}
                                            </td>
                                            <td className="px-5 py-4">
                                                {trade.traderName}
                                            </td>
                                            <td className="px-5 py-4 font-semibold">
                                                {trade.stockSymbol}
                                            </td>
                                            <td className="px-5 py-4">
                                                {trade.tradeType}
                                            </td>
                                            <td className="px-5 py-4">
                                                {trade.quantity}
                                            </td>
                                            <td className="px-5 py-4">
                                                ₹{trade.price}
                                            </td>
                                            <td className="px-5 py-4 font-semibold">
                                                ₹{trade.tradeValue?.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {new Date(trade.tradeTime).toLocaleString()}
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

export default Trades;
