import { useState } from "react";
import { askRiskAssistant } from "../api/api";
import AIFormattedOutput from "../components/AIFormattedOutput";

const suggestedQuestions = [
    "Which traders are risky today?",
    "Which rule triggered the most?",
    "Show recent high severity alerts",
    "Why are trades getting blocked?",
    "Show recent alerts for INFY",
    "Show alerts for trader T3001"
];

const RiskAssistant = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [intent, setIntent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAsk = async (customQuestion) => {
        const finalQuestion = customQuestion || question;

        if (!finalQuestion.trim()) {
            setError("Please enter a question.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setAnswer("");
            setIntent("");

            const response = await askRiskAssistant(finalQuestion);

            setQuestion(finalQuestion);
            setAnswer(response.data.data.answer);
            setIntent(response.data.data.intent);
        }
        catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to get response from risk assistant"
            );
        }
        finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAsk();
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    AI Risk Assistant
                </h1>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Ask natural-language questions about alerts, blocked trades,
                    triggered rules, risky traders, and recent risk activity.
                </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow dark:bg-slate-900">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Ask a risk question
                    </label>

                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={4}
                        placeholder="Example: Which traders triggered the most high-risk alerts?"
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-indigo-900"
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? "Thinking..." : "Ask Risk Assistant"}
                        </button>

                        {intent && (
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                Intent: {intent}
                            </span>
                        )}
                    </div>
                </form>

                <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Suggested questions
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => handleAsk(item)}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-lg bg-red-50 p-4 font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        {error}
                    </div>
                )}

                {answer && (
                    <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-800 dark:bg-indigo-950/40">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Assistant Response
                            </h2>

                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(answer)}
                                className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950"
                            >
                                Copy
                            </button>
                        </div>

                        <AIFormattedOutput content={answer} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskAssistant;