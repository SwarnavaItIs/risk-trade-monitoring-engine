import { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { forgotPassword } from "../api/api";
import useToast from "../hooks/useToast";

const ForgotPassword = () => {
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            setError("");
            setResetToken("");

            const response = await forgotPassword(email);

            setResetToken(response.data.data.resetToken);
            showToast(response.data.message || "Password reset link generated.", {
                title: "Reset link ready"
            });
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to generate reset token";

            setError(message);
            showToast(message, { title: "Reset request failed", variant: "danger" });
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-8">
            <div className="fixed right-4 top-4 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
                <h1 className="text-3xl font-bold text-slate-900">
                    Forgot Password
                </h1>

                <p className="mt-2 text-slate-600">
                    Enter your email to generate a password reset link.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    {error && (
                        <p className="font-semibold text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? "Generating..." : "Generate Reset Link"}
                    </button>
                </form>

                {resetToken && (
                    <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                        <p className="font-semibold">
                            Demo reset link generated:
                        </p>

                        <Link
                            className="mt-2 block break-all font-semibold text-blue-600 hover:underline"
                            to={`/reset-password/${resetToken}`}
                        >
                            Go to reset password page
                        </Link>

                        <p className="mt-2 text-xs text-green-700">
                            This token expires in 15 minutes.
                        </p>
                    </div>
                )}

                <p className="mt-5 text-sm text-slate-600">
                    Remembered your password?{" "}
                    <Link className="font-semibold text-indigo-600 hover:underline" to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
