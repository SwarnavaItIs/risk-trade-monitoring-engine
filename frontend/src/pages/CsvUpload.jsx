import { useState } from "react";
import { uploadTradesCSV } from "../api/api";

import LoadingButton from "../components/LoadingButton";
import useToast from "../hooks/useToast";

const CsvUpload = () => {
    const { showToast } = useToast();
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const validateFile = (selectedFile) => {
        if (!selectedFile) {
            return;
        }

        if (!selectedFile.name.endsWith(".csv")) {
            const message = "Only CSV files are allowed.";
            setError(message);
            showToast(message, { title: "Invalid file", variant: "danger" });
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setResult(null);
        setError("");
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        validateFile(selectedFile);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragActive(false);

        const droppedFile = event.dataTransfer.files[0];
        validateFile(droppedFile);
    };

    const handleRemoveFile = () => {
        setFile(null);
        setResult(null);
        setError("");
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!file) {
            const message = "Please select or drop a CSV file first.";
            setError(message);
            showToast(message, { title: "No file selected", variant: "danger" });
            return;
        }

        try {
            setUploading(true);
            setError("");
            setResult(null);

            const response = await uploadTradesCSV(file);

            setResult(response.data.data);
            setFile(null);
            showToast(response.data.message || "CSV trades uploaded successfully.", {
                title: "Upload completed"
            });
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to upload CSV";

            setError(message);
            showToast(message, { title: "Upload failed", variant: "danger" });
            console.log(err);
        }
        finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">
                    CSV Trade Upload
                </h1>

                <p className="mt-2 text-slate-600">
                    Upload a CSV file to bulk insert trades and generate risk alerts.
                </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                    Upload Trades CSV
                </h2>

                <form onSubmit={handleUpload} className="space-y-5">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${dragActive
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-slate-300 bg-slate-50 hover:border-indigo-400"
                            }`}
                    >
                        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <svg
                                className="size-7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                                />
                            </svg>
                        </div>

                        <p className="text-lg font-semibold text-slate-900">
                            Drag and drop your CSV file here
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            or click below to browse from your computer
                        </p>

                        <label className="mt-5 cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-indigo-700">
                            Browse CSV
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {file && (
                        <div className="flex items-center justify-between rounded-xl bg-slate-100 p-4">
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {file.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-white"
                            >
                                Remove
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Upload CSV
                    </button>
                </form>

                {uploading && (
                    <div className="mt-6">
                        <LoadingButton text="Processing CSV..." />
                    </div>
                )}

                {error && (
                    <div className="mt-6 rounded-lg bg-red-50 p-4 font-semibold text-red-700">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                        <h3 className="mb-4 text-lg font-bold text-slate-900">
                            Upload Summary
                        </h3>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-500">Total Rows</p>
                                <h4 className="mt-1 text-2xl font-bold text-slate-900">
                                    {result.totalRows}
                                </h4>
                            </div>

                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-500">Trades Saved</p>
                                <h4 className="mt-1 text-2xl font-bold text-green-600">
                                    {result.tradesSaved}
                                </h4>
                            </div>

                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-500">Alerts Generated</p>
                                <h4 className="mt-1 text-2xl font-bold text-red-600">
                                    {result.alertsGenerated}
                                </h4>
                            </div>

                            <div className="rounded-xl bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-500">Failed Rows</p>
                                <h4 className="mt-1 text-2xl font-bold text-amber-600">
                                    {result.failedRowsCount}
                                </h4>
                            </div>
                        </div>

                        {result.failedRows?.length > 0 && (
                            <div className="mt-6">
                                <h4 className="mb-3 font-bold text-slate-900">
                                    Failed Rows
                                </h4>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white text-slate-600">
                                            <tr>
                                                <th className="px-4 py-3">Row</th>
                                                <th className="px-4 py-3">Reason</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-200">
                                            {result.failedRows.map((row) => (
                                                <tr key={row.rowNumber}>
                                                    <td className="px-4 py-3">
                                                        {row.rowNumber}
                                                    </td>

                                                    <td className="px-4 py-3 text-red-600">
                                                        <p className="font-semibold">
                                                            {row.reason}
                                                        </p>

                                                        {row.failedRules?.length > 0 && (
                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                                                {row.failedRules.map((rule) => (
                                                                    <li key={rule.ruleCode}>
                                                                        <span className="font-semibold">
                                                                            {rule.ruleCode}
                                                                        </span>
                                                                        {" — "}
                                                                        {rule.reason}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 shadow">
                <h3 className="mb-3 text-lg font-bold text-slate-900">
                    Required CSV Format
                </h3>

                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                    {`traderId,traderName,stockSymbol,tradeType,quantity,price,tradeTime
T1001,Aman Roy,INFY,BUY,10,1500,2026-05-20T10:00:00
T1002,Neha Roy,PAYTM,BUY,6000,450,2026-05-20T10:05:00`}
                </pre>
            </div>
        </div>
    );
};

export default CsvUpload;
