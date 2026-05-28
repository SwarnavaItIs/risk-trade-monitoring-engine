import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAlertById, updateAlertStatus } from "../api/api";

import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const AlertDetails = () => {
    const { id } = useParams();

    const [alert, setAlert] = useState(null);

    const [reviewData, setReviewData] = useState({
        status: "UNDER_REVIEW",
        reviewComment: "",
        reviewedBy: ""
    });

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [updateMessage, setUpdateMessage] = useState("");

    const fetchAlertDetails = async () => {
        try {
            setLoading(true);

            const response = await getAlertById(id);

            setAlert(response.data.data);
            setError("");
        }
        catch (err) {
            setError("Failed to load alert details");
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlertDetails();
    }, [id]);

    const handleReviewChange = (event) => {
        const { name, value } = event.target;

        setReviewData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleStatusUpdate = async (event) => {
        event.preventDefault();

        try {
            setUpdating(true);
            setUpdateMessage("");
            setError("");

            const response = await updateAlertStatus(id, reviewData);

            setAlert(response.data.data);
            setUpdateMessage("Alert status updated successfully.");
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to update alert status";

            setError(message);
            console.log(err);
        }
        finally {
            setUpdating(false);
        }
    };

    const quickUpdateStatus = async (newStatus) => {
        try {
            setUpdating(true);
            setUpdateMessage("");
            setError("");

            const payload = {
                ...reviewData,
                status: newStatus
            };

            const response = await updateAlertStatus(id, payload);

            setAlert(response.data.data);

            setReviewData((prevData) => ({
                ...prevData,
                status: newStatus
            }));

            setUpdateMessage(`Alert marked as ${newStatus}.`);
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to update alert status";

            setError(message);
            console.log(err);
        }
        finally {
            setUpdating(false);
        }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Alert Details
                    </h1>

                    <p className="mt-2 text-slate-600">
                        Loading alert details...
                    </p>
                </div>

                <SkeletonLoader type="details" />
            </div>
        );
    }

    if (error && !alert) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Alert Details
                </h1>

                <p className="mt-4 font-semibold text-red-600">
                    {error}
                </p>

                <Link
                    className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
                    to="/alerts"
                >
                    Back to Alerts
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <Link
                className="font-semibold text-blue-600 hover:underline"
                to="/alerts"
            >
                ← Back to Alerts
            </Link>

            <div className="mt-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    Alert Details
                </h1>

                <p className="mt-2 text-slate-600">
                    Review alert, update status, and add investigation comments.
                </p>
            </div>

            {updating && (
                <div className="mb-6">
                    <LoadingButton text="Updating alert..." />
                </div>
            )}

            {updateMessage && (
                <div className="mb-6 rounded-lg bg-green-50 p-4 font-semibold text-green-700">
                    {updateMessage}
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Alert Information
                    </h3>

                    <div className="space-y-3 text-sm">
                        <p>
                            <strong>Alert Type:</strong> {alert.alertType}
                        </p>

                        <p>
                            <strong>Severity:</strong>{" "}
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${getSeverityClass(alert.severity)}`}
                            >
                                {alert.severity}
                            </span>
                        </p>

                        <p>
                            <strong>Risk Score:</strong> {alert.riskScore}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(alert.status)}`}
                            >
                                {alert.status}
                            </span>
                        </p>

                        <p>
                            <strong>Created:</strong>{" "}
                            {new Date(alert.createdAt).toLocaleString()}
                        </p>

                        {alert.reviewedAt && (
                            <p>
                                <strong>Reviewed At:</strong>{" "}
                                {new Date(alert.reviewedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Trader Information
                    </h3>

                    <div className="space-y-3 text-sm">
                        <p>
                            <strong>Trader ID:</strong> {alert.traderId}
                        </p>

                        <p>
                            <strong>Trader Name:</strong> {alert.traderName}
                        </p>

                        <p>
                            <strong>Stock:</strong> {alert.stockSymbol}
                        </p>

                        {alert.reviewedBy && (
                            <p>
                                <strong>Reviewed By:</strong> {alert.reviewedBy}
                            </p>
                        )}

                        {alert.reviewComment && (
                            <p>
                                <strong>Review Comment:</strong>{" "}
                                {alert.reviewComment}
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Review Workflow
                    </h3>

                    <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Status
                            </label>

                            <select
                                name="status"
                                value={reviewData.status}
                                onChange={handleReviewChange}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                                <option value="ESCALATED">ESCALATED</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Reviewed By
                            </label>

                            <input
                                type="text"
                                name="reviewedBy"
                                value={reviewData.reviewedBy}
                                onChange={handleReviewChange}
                                placeholder="Swarnava"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Review Comment
                            </label>

                            <textarea
                                name="reviewComment"
                                value={reviewData.reviewComment}
                                onChange={handleReviewChange}
                                placeholder="Write investigation notes..."
                                rows="4"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 md:col-span-2">
                            <button
                                type="submit"
                                disabled={updating}
                                className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Update Status
                            </button>

                            <button
                                type="button"
                                disabled={updating}
                                onClick={() => quickUpdateStatus("ESCALATED")}
                                className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Escalate
                            </button>

                            <button
                                type="button"
                                disabled={updating}
                                onClick={() => quickUpdateStatus("RESOLVED")}
                                className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Resolve
                            </button>

                            <button
                                type="button"
                                disabled={updating}
                                onClick={() => quickUpdateStatus("FALSE_POSITIVE")}
                                className="rounded-lg bg-slate-700 px-5 py-2 font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                False Positive
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Triggered Rules
                    </h3>

                    {alert.triggeredRules.length === 0 ? (
                        <p className="text-slate-600">
                            No triggered rules.
                        </p>
                    ) : (
                        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                            {alert.triggeredRules.map((rule, index) => (
                                <li key={index}>{rule}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Reasons
                    </h3>

                    {alert.reasons.length === 0 ? (
                        <p className="text-slate-600">
                            No reasons found.
                        </p>
                    ) : (
                        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                            {alert.reasons.map((reason, index) => (
                                <li key={index}>{reason}</li>
                            ))}
                        </ul>
                    )}
                </div>

                {alert.tradeId && (
                    <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">
                            Original Trade
                        </h3>

                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <p>
                                <strong>Trade Type:</strong>{" "}
                                {alert.tradeId.tradeType}
                            </p>

                            <p>
                                <strong>Quantity:</strong>{" "}
                                {alert.tradeId.quantity}
                            </p>

                            <p>
                                <strong>Price:</strong> ₹{alert.tradeId.price}
                            </p>

                            <p>
                                <strong>Trade Value:</strong>{" "}
                                ₹{alert.tradeId.tradeValue?.toLocaleString()}
                            </p>

                            <p>
                                <strong>Trade Time:</strong>{" "}
                                {new Date(alert.tradeId.tradeTime).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertDetails;