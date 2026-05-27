import { useEffect, useState } from "react";
import { getTrades } from "../api/api";
import LoadingButton from "../components/LoadingButton";
import SkeletonLoader from "../components/SkeletonLoader";

const Trades = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
        fetchTrades();
    }, []);

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Trades</h1>
                <p className="mt-2 text-slate-600">
                    All trades stored in the monitoring system.
                </p>
            </div>

            {loading && (
                <>
                <div className="mt-4 mb-8">
                    <LoadingButton text="Loading trades..." />
                </div>

                <SkeletonLoader type="table" />
                </>
            )}

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
                                            <td className="px-5 py-4">{trade.traderName}</td>
                                            <td className="px-5 py-4 font-semibold">
                                                {trade.stockSymbol}
                                            </td>
                                            <td className="px-5 py-4">{trade.tradeType}</td>
                                            <td className="px-5 py-4">{trade.quantity}</td>
                                            <td className="px-5 py-4">₹{trade.price}</td>
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