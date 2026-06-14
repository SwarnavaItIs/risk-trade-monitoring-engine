import { useEffect, useState } from "react";

import {
    cancelOrder,
    createOrder,
    fillOrder,
    getOrders
} from "../api/api";
import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const initialForm = {
    orderId: "",
    traderId: "",
    traderName: "",
    stockSymbol: "",
    side: "BUY",
    quantity: "",
    price: ""
};

const initialFilters = {
    status: "",
    traderId: "",
    stockSymbol: ""
};

const getStatusClass = (status) => {
    if (status === "FILLED") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    }

    if (status === "PARTIALLY_FILLED") {
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
    }

    if (status === "CANCELLED") {
        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    }

    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actionOrderId, setActionOrderId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [riskResult, setRiskResult] = useState(null);

    const fetchOrders = async (appliedFilters = filters) => {
        try {
            setLoading(true);

            const response = await getOrders(appliedFilters);

            setOrders(response.data.data || []);
            setError("");
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to load orders");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders(initialFilters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value
        }));
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((currentFilters) => ({
            ...currentFilters,
            [name]: value
        }));
    };

    const handleCreateOrder = async (event) => {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");
            setMessage("");
            setRiskResult(null);

            const response = await createOrder({
                ...form,
                quantity: Number(form.quantity),
                price: Number(form.price)
            });

            setForm(initialForm);
            setMessage(response.data.message);
            setRiskResult(response.data.data.riskResult);
            await fetchOrders(filters);
        }
        catch (err) {
            setError(err.response?.data?.message || "Failed to create order");
        }
        finally {
            setSubmitting(false);
        }
    };

    const handleLifecycleAction = async (order, action) => {
        try {
            setActionOrderId(order._id);
            setError("");
            setMessage("");
            setRiskResult(null);

            const response = action === "cancel"
                ? await cancelOrder(order._id)
                : await fillOrder(order._id);

            setMessage(response.data.message);
            setRiskResult(response.data.data.riskResult);
            await fetchOrders(filters);
        }
        catch (err) {
            setError(err.response?.data?.message || `Failed to ${action} order`);
        }
        finally {
            setActionOrderId("");
        }
    };

    const handleApplyFilters = (event) => {
        event.preventDefault();
        fetchOrders(filters);
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        fetchOrders(initialFilters);
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Orders
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Manage order lifecycles and monitor cancellation-to-fill behavior.
                </p>
            </div>

            <section className="mb-6 rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Create Order
                </h2>

                <form onSubmit={handleCreateOrder} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <input name="orderId" value={form.orderId} onChange={handleFormChange} placeholder="Order ID" required className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    <input name="traderId" value={form.traderId} onChange={handleFormChange} placeholder="Trader ID" required className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    <input name="traderName" value={form.traderName} onChange={handleFormChange} placeholder="Trader name" required className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    <input name="stockSymbol" value={form.stockSymbol} onChange={handleFormChange} placeholder="Stock symbol" required className="rounded-lg border border-slate-300 px-3 py-2 uppercase dark:border-slate-700 dark:bg-slate-950 dark:text-white" />

                    <select name="side" value={form.side} onChange={handleFormChange} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                    <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="Quantity" required className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    <input type="number" min="0.01" step="0.01" name="price" value={form.price} onChange={handleFormChange} placeholder="Price" required className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />

                    <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                        {submitting ? "Creating..." : "Create Order"}
                    </button>
                </form>
            </section>

            {(submitting || actionOrderId) && (
                <div className="mb-6">
                    <LoadingButton text="Processing order lifecycle..." />
                </div>
            )}

            {message && (
                <div className="mb-6 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {message}
                </div>
            )}

            {riskResult?.isRisky && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
                    <h2 className="font-bold text-red-700 dark:text-red-300">
                        R9 Order-to-Trade Ratio Alert Generated
                    </h2>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                        {riskResult.reasons?.[0]}
                    </p>
                </div>
            )}

            {error && (
                <p className="mb-6 rounded-xl bg-red-50 p-4 font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </p>
            )}

            <form onSubmit={handleApplyFilters} className="mb-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow dark:bg-slate-900 md:grid-cols-4">
                <select name="status" value={filters.status} onChange={handleFilterChange} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                    <option value="">All statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="PARTIALLY_FILLED">Partially filled</option>
                    <option value="FILLED">Filled</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
                <input name="traderId" value={filters.traderId} onChange={handleFilterChange} placeholder="Filter trader ID" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                <input name="stockSymbol" value={filters.stockSymbol} onChange={handleFilterChange} placeholder="Filter stock symbol" className="rounded-lg border border-slate-300 px-3 py-2 uppercase dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Apply</button>
                    <button type="button" onClick={handleResetFilters} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Reset</button>
                </div>
            </form>

            {loading && <SkeletonLoader type="table" />}

            {!loading && (
                <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Order</th>
                                    <th className="px-5 py-4">Trader</th>
                                    <th className="px-5 py-4">Symbol / Side</th>
                                    <th className="px-5 py-4">Quantity</th>
                                    <th className="px-5 py-4">Price / Value</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Created</th>
                                    <th className="px-5 py-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-5 py-8 text-center text-slate-500">No orders found.</td>
                                    </tr>
                                ) : orders.map((order) => {
                                    const canAct = ["SUBMITTED", "PARTIALLY_FILLED"].includes(order.status);

                                    return (
                                        <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                            <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{order.orderId}</td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">{order.traderId}</div>
                                                <div className="text-xs text-slate-500">{order.traderName}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">{order.stockSymbol}</div>
                                                <div className="text-xs text-slate-500">{order.side}</div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                {order.filledQuantity} / {order.quantity}
                                            </td>
                                            <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                                                <div>INR {order.price?.toLocaleString()}</div>
                                                <div className="text-xs text-slate-500">INR {order.orderValue?.toLocaleString()}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                {canAct ? (
                                                    <div className="flex gap-2">
                                                        <button type="button" disabled={actionOrderId === order._id} onClick={() => handleLifecycleAction(order, "fill")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Fill</button>
                                                        <button type="button" disabled={actionOrderId === order._id} onClick={() => handleLifecycleAction(order, "cancel")} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500">Lifecycle complete</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
