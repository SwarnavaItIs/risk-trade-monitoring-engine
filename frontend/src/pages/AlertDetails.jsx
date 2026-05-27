import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAlertById } from "../api/api";
import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const AlertDetails = () => {
    const { id } = useParams();

    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Alert Details
                    </h1>
                </div>

                <div className="mt-4 mb-8">
                    <LoadingButton text="Loading alert details..." />
                </div>

                <SkeletonLoader type="details" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-100 p-8">
                <h1 className="text-3xl font-bold text-slate-900">Alert Details</h1>
                <p className="mt-2 font-semibold text-red-600">{error}</p>
                <Link className="mt-4 inline-block font-semibold text-blue-600" to="/alerts">
                    Back to Alerts
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <Link className="font-semibold text-blue-600 hover:underline" to="/alerts">
                ← Back to Alerts
            </Link>

            <div className="mt-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Alert Details</h1>
                <p className="mt-2 text-slate-600">
                    Detailed risk explanation and original trade information.
                </p>

            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Alert Information
                    </h3>

                    <div className="space-y-2 text-sm">
                        <p><strong>Alert Type:</strong> {alert.alertType}</p>
                        <p><strong>Severity:</strong> {alert.severity}</p>
                        <p><strong>Risk Score:</strong> {alert.riskScore}</p>
                        <p><strong>Status:</strong> {alert.status}</p>
                        <p><strong>Created:</strong> {new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Trader Information
                    </h3>

                    <div className="space-y-2 text-sm">
                        <p><strong>Trader ID:</strong> {alert.traderId}</p>
                        <p><strong>Trader Name:</strong> {alert.traderName}</p>
                        <p><strong>Stock:</strong> {alert.stockSymbol}</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                        Triggered Rules
                    </h3>

                    {alert.triggeredRules.length === 0 ? (
                        <p className="text-slate-600">No triggered rules.</p>
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
                        <p className="text-slate-600">No reasons found.</p>
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
                            <p><strong>Trade Type:</strong> {alert.tradeId.tradeType}</p>
                            <p><strong>Quantity:</strong> {alert.tradeId.quantity}</p>
                            <p><strong>Price:</strong> ₹{alert.tradeId.price}</p>
                            <p><strong>Trade Value:</strong> ₹{alert.tradeId.tradeValue?.toLocaleString()}</p>
                            <p><strong>Trade Time:</strong> {new Date(alert.tradeId.tradeTime).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertDetails;