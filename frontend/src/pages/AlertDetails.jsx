import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    addAlertComment,
    assignAlert,
    getAdminMembers,
    getAlertById,
    updateAlertPriority,
    updateAlertStatus
} from "../api/api";

import DateTimeInput from "../components/DateTimeInput";
import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";
import useToast from "../hooks/useToast";
import {
    dateTimeLocalToIso,
    formatForDateTimeLocal
} from "../utils/dateTime";

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

const AlertDetails = () => {
    const { id } = useParams();
    const { showToast } = useToast();
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const isAdmin = currentUser?.role === "ADMIN";

    const [alert, setAlert] = useState(null);
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [comment, setComment] = useState("");

    const [reviewData, setReviewData] = useState({
        status: "UNDER_REVIEW",
        reviewComment: "",
        reviewedBy: currentUser?.name || ""
    });

    const [assignmentData, setAssignmentData] = useState({
        assignedTo: "",
        priority: "MEDIUM",
        reviewDeadline: ""
    });

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [workflowUpdating, setWorkflowUpdating] = useState(false);
    const [error, setError] = useState("");

    const syncAlertState = (nextAlert) => {
        setAlert(nextAlert);
        setAssignmentData({
            assignedTo:
                typeof nextAlert.assignedTo === "object"
                    ? nextAlert.assignedTo?._id || ""
                    : nextAlert.assignedTo || "",
            priority: nextAlert.priority || nextAlert.severity || "MEDIUM",
            reviewDeadline: formatForDateTimeLocal(nextAlert.reviewDeadline)
        });
    };

    const fetchAlertDetails = async () => {
        try {
            setLoading(true);

            const response = await getAlertById(id);
            const nextAlert = response.data.data;

            syncAlertState(nextAlert);
            setReviewData({
                status: nextAlert.status || "UNDER_REVIEW",
                reviewComment: "",
                reviewedBy: nextAlert.reviewedBy || currentUser?.name || ""
            });
            setError("");
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to load alert details");
        }
        finally {
            setLoading(false);
        }
    };

    const fetchAssignableUsers = async () => {
        if (!isAdmin) {
            return;
        }

        try {
            const response = await getAdminMembers();
            const members = response.data.data.members || [];

            setAssignableUsers(
                members.filter((member) => (
                    ["ANALYST", "ADMIN"].includes(member.role) &&
                    member.status !== "SUSPENDED"
                ))
            );
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to load assignable users");
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAlertDetails();
        fetchAssignableUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleReviewChange = (event) => {
        const { name, value } = event.target;

        setReviewData((currentData) => ({
            ...currentData,
            [name]: value
        }));
    };

    const handleAssignmentChange = (event) => {
        const { name, value } = event.target;

        setAssignmentData((currentData) => ({
            ...currentData,
            [name]: value
        }));
    };

    const handleStatusUpdate = async (event) => {
        event.preventDefault();

        try {
            setUpdating(true);
            setError("");

            const response = await updateAlertStatus(id, reviewData);

            setAlert(response.data.data);
            setReviewData((currentData) => ({
                ...currentData,
                reviewComment: ""
            }));
            showToast("Alert status updated successfully.", {
                title: "Alert updated"
            });
        }
        catch (err) {
            const message = err.response?.data?.message || "Failed to update alert status";
            setError(message);
            showToast(message, { title: "Update failed", variant: "danger" });
        }
        finally {
            setUpdating(false);
        }
    };

    const quickUpdateStatus = async (newStatus) => {
        try {
            setUpdating(true);
            setError("");

            const payload = {
                ...reviewData,
                status: newStatus
            };

            const response = await updateAlertStatus(id, payload);

            setAlert(response.data.data);
            setReviewData((currentData) => ({
                ...currentData,
                status: newStatus,
                reviewComment: ""
            }));
            showToast(`Alert marked as ${newStatus}.`, {
                title: "Alert updated"
            });
        }
        catch (err) {
            const message = err.response?.data?.message || "Failed to update alert status";
            setError(message);
            showToast(message, { title: "Update failed", variant: "danger" });
        }
        finally {
            setUpdating(false);
        }
    };

    const handleAssignmentSubmit = async (event) => {
        event.preventDefault();

        try {
            setWorkflowUpdating(true);
            setError("");

            const response = await assignAlert(id, {
                assignedTo: assignmentData.assignedTo,
                priority: assignmentData.priority,
                reviewDeadline: dateTimeLocalToIso(
                    assignmentData.reviewDeadline,
                    null
                )
            });

            syncAlertState(response.data.data);
            showToast(response.data.message || "Alert assignment updated.", {
                title: "Assignment updated"
            });
        }
        catch (err) {
            const message = err.response?.data?.message || "Failed to update assignment";
            setError(message);
            showToast(message, { title: "Assignment failed", variant: "danger" });
        }
        finally {
            setWorkflowUpdating(false);
        }
    };

    const handlePriorityUpdate = async () => {
        try {
            setWorkflowUpdating(true);
            setError("");

            const response = await updateAlertPriority(id, {
                priority: assignmentData.priority
            });

            setAlert(response.data.data);
            showToast(response.data.message || "Alert priority updated.", {
                title: "Priority updated"
            });
        }
        catch (err) {
            const message = err.response?.data?.message || "Failed to update priority";
            setError(message);
            showToast(message, { title: "Priority update failed", variant: "danger" });
        }
        finally {
            setWorkflowUpdating(false);
        }
    };

    const handleCommentSubmit = async (event) => {
        event.preventDefault();

        try {
            setWorkflowUpdating(true);
            setError("");

            const response = await addAlertComment(id, { comment });

            syncAlertState(response.data.data);
            setComment("");
            showToast(response.data.message || "Comment added.", {
                title: "Comment added"
            });
        }
        catch (err) {
            const message = err.response?.data?.message || "Failed to add comment";
            setError(message);
            showToast(message, { title: "Comment failed", variant: "danger" });
        }
        finally {
            setWorkflowUpdating(false);
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
            <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
                <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">
                    Alert Details
                </h1>
                <SkeletonLoader type="details" />
            </div>
        );
    }

    if (error && !alert) {
        return (
            <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Alert Details
                </h1>
                <p className="mt-4 font-semibold text-red-600">{error}</p>
                <Link className="mt-4 inline-block font-semibold text-blue-600 hover:underline" to="/alerts">
                    Back to Alerts
                </Link>
            </div>
        );
    }

    const priority = alert.priority || alert.severity || "MEDIUM";
    const comments = [...(alert.commentHistory || [])].reverse();

    return (
        <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
            <Link className="font-semibold text-blue-600 hover:underline" to="/alerts">
                Back to Alerts
            </Link>

            <div className="mb-6 mt-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Alert Details
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Review the alert, manage ownership, and record investigation activity.
                </p>
            </div>

            {(updating || workflowUpdating) && (
                <div className="mb-6">
                    <LoadingButton text="Updating alert..." />
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 font-semibold text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                        Alert Information
                    </h3>
                    <div className="space-y-3 text-sm">
                        <p><strong>Alert Type:</strong> {alert.alertType}</p>
                        <p>
                            <strong>Severity:</strong>{" "}
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${getSeverityClass(alert.severity)}`}>
                                {alert.severity}
                            </span>
                        </p>
                        <p>
                            <strong>Priority:</strong>{" "}
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityClass(priority)}`}>
                                {priority}
                            </span>
                        </p>
                        <p><strong>Risk Score:</strong> {alert.riskScore}</p>
                        <p>
                            <strong>Status:</strong>{" "}
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(alert.status)}`}>
                                {alert.status}
                            </span>
                        </p>
                        <p><strong>Created:</strong> {new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                        Trader Information
                    </h3>
                    <div className="space-y-3 text-sm">
                        <p><strong>Trader ID:</strong> {alert.traderId}</p>
                        <p><strong>Trader Name:</strong> {alert.traderName}</p>
                        <p><strong>Stock:</strong> {alert.stockSymbol}</p>
                        {alert.reviewedBy && <p><strong>Reviewed By:</strong> {alert.reviewedBy}</p>}
                        {alert.reviewedAt && (
                            <p><strong>Reviewed At:</strong> {new Date(alert.reviewedAt).toLocaleString()}</p>
                        )}
                        {alert.reviewComment && <p><strong>Latest Review Comment:</strong> {alert.reviewComment}</p>}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Assignment & Review Workflow
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950 md:grid-cols-3">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Assigned To</p>
                            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                {alert.assignedToName || "Unassigned"}
                            </p>
                            {alert.assignedToEmail && <p className="text-sm text-slate-500">{alert.assignedToEmail}</p>}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Priority</p>
                            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${getPriorityClass(priority)}`}>
                                {priority}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">Review Deadline</p>
                            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                {alert.reviewDeadline
                                    ? new Date(alert.reviewDeadline).toLocaleString()
                                    : "No deadline"}
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <form onSubmit={handleAssignmentSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Assign User
                                </label>
                                <select
                                    name="assignedTo"
                                    value={assignmentData.assignedTo}
                                    onChange={handleAssignmentChange}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                >
                                    <option value="">Unassigned</option>
                                    {assignableUsers.map((member) => (
                                        <option key={member._id} value={member._id}>
                                            {member.name} ({member.role}) - {member.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={assignmentData.priority}
                                    onChange={handleAssignmentChange}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                >
                                    <option value="CRITICAL">CRITICAL</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="LOW">LOW</option>
                                </select>
                            </div>

                            <DateTimeInput
                                label="Review Deadline"
                                name="reviewDeadline"
                                value={assignmentData.reviewDeadline}
                                onChange={handleAssignmentChange}
                                helperText="Select the date and time the review should be completed."
                            />

                            <div className="flex flex-wrap gap-3 md:col-span-3">
                                <button
                                    type="submit"
                                    disabled={workflowUpdating}
                                    className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                >
                                    Assign / Update Assignment
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePriorityUpdate}
                                    disabled={workflowUpdating}
                                    className="rounded-lg border border-indigo-300 px-5 py-2 font-semibold text-indigo-700 dark:text-indigo-300 disabled:opacity-60"
                                >
                                    Update Priority Only
                                </button>
                            </div>
                        </form>
                    )}

                    <form onSubmit={handleCommentSubmit} className="mt-6">
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Add Investigation Comment
                        </label>
                        <textarea
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            placeholder="Add an investigation note..."
                            rows="4"
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                        <button
                            type="submit"
                            disabled={workflowUpdating || !comment.trim()}
                            className="mt-3 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            Add Comment
                        </button>
                    </form>

                    <div className="mt-6">
                        <h4 className="font-bold text-slate-900 dark:text-white">Comment History</h4>
                        {comments.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500">No investigation comments yet.</p>
                        ) : (
                            <div className="mt-3 space-y-3">
                                {comments.map((entry) => (
                                    <div key={entry._id || entry.createdAt} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{entry.comment}</p>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {entry.commentedBy} ({entry.commentedByRole}) | {entry.commentedByEmail} |{" "}
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900 lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                        Status Review Workflow
                    </h3>
                    <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <select
                            name="status"
                            value={reviewData.status}
                            onChange={handleReviewChange}
                            className="rounded-lg border border-slate-300 px-3 py-2"
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                            <option value="ESCALATED">ESCALATED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                        </select>

                        <input
                            type="text"
                            name="reviewedBy"
                            value={reviewData.reviewedBy}
                            onChange={handleReviewChange}
                            placeholder="Reviewed by"
                            className="rounded-lg border border-slate-300 px-3 py-2"
                        />

                        <textarea
                            name="reviewComment"
                            value={reviewData.reviewComment}
                            onChange={handleReviewChange}
                            placeholder="Legacy review comment (optional)"
                            rows="3"
                            className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
                        />

                        <div className="flex flex-wrap gap-3 md:col-span-2">
                            <button type="submit" disabled={updating} className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white disabled:opacity-60">
                                Update Status
                            </button>
                            <button type="button" disabled={updating} onClick={() => quickUpdateStatus("ESCALATED")} className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white disabled:opacity-60">
                                Escalate
                            </button>
                            <button type="button" disabled={updating} onClick={() => quickUpdateStatus("RESOLVED")} className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white disabled:opacity-60">
                                Resolve
                            </button>
                            <button type="button" disabled={updating} onClick={() => quickUpdateStatus("FALSE_POSITIVE")} className="rounded-lg bg-slate-700 px-5 py-2 font-semibold text-white disabled:opacity-60">
                                False Positive
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900 lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Triggered Rules</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
                        {(alert.triggeredRules || []).map((rule) => <li key={rule}>{rule}</li>)}
                    </ul>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900 lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Reasons</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
                        {(alert.reasons || []).map((reason, index) => <li key={`${reason}-${index}`}>{reason}</li>)}
                    </ul>
                </div>

                {alert.tradeId && (
                    <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900 lg:col-span-2">
                        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Original Trade</h3>
                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <p><strong>Trade Type:</strong> {alert.tradeId.tradeType}</p>
                            <p><strong>Quantity:</strong> {alert.tradeId.quantity}</p>
                            <p><strong>Price:</strong> INR {alert.tradeId.price}</p>
                            <p><strong>Trade Value:</strong> INR {alert.tradeId.tradeValue?.toLocaleString()}</p>
                            <p><strong>Trade Time:</strong> {new Date(alert.tradeId.tradeTime).toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {alert.orderId && (
                    <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900 lg:col-span-2">
                        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Original Order</h3>
                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <p><strong>Order ID:</strong> {alert.orderId.orderId}</p>
                            <p><strong>Side:</strong> {alert.orderId.side}</p>
                            <p><strong>Status:</strong> {alert.orderId.status}</p>
                            <p><strong>Quantity:</strong> {alert.orderId.quantity}</p>
                            <p><strong>Filled Quantity:</strong> {alert.orderId.filledQuantity}</p>
                            <p><strong>Price:</strong> INR {alert.orderId.price}</p>
                            <p><strong>Order Value:</strong> INR {alert.orderId.orderValue?.toLocaleString()}</p>
                            <p><strong>Submitted:</strong> {new Date(alert.orderId.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertDetails;
