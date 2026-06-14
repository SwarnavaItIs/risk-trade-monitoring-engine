import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { resetPassword } from "../api/api";
import useToast from "../hooks/useToast";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            const message = "Passwords do not match";
            setError(message);
            showToast(message, { title: "Password reset failed", variant: "danger" });
            return;
        }

        try {
            setLoading(true);
            setError("");

            await resetPassword(token, password);

            navigate("/login");
            showToast("Your password was reset successfully.", {
                title: "Password updated"
            });
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to reset password";

            setError(message);
            showToast(message, { title: "Password reset failed", variant: "danger" });
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
                    Reset Password
                </h1>

                <p className="mt-2 text-slate-600">
                    Enter your new password.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            New Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
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
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="mt-5 text-sm text-slate-600">
                    Go back to{" "}
                    <Link className="font-semibold text-indigo-600 hover:underline" to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
