import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

import GoogleIconButton from "../components/GoogleIconButton"; 
import { googleLoginUser, registerUser } from "../api/api";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        adminSecret: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError("");

            const response = await googleLoginUser(credentialResponse.credential);

            localStorage.setItem("token", response.data.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.data.user));

            navigate("/dashboard");
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Google registration failed";

            setError(message);
            console.log(err);
        }
        finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await registerUser(formData);

            localStorage.setItem("token", response.data.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.data.user));

            navigate("/dashboard");
        }
        catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to register";

            setError(message);
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
                    Register
                </h1>

                <p className="mt-2 text-slate-600">
                    Create an account to access the monitoring dashboard.
                </p>

                <div className="my-6 flex items-center">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            Admin Secret Code Optional
                        </label>

                        <input
                            type="password"
                            name="adminSecret"
                            value={formData.adminSecret}
                            onChange={handleChange}
                            placeholder="Only admin should know this"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                            Leave this empty to register as an analyst.
                        </p>
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
                        {loading ? "Creating account..." : "Register"}
                    </button>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <span className="text-sm text-slate-500">
                            or you can sign up with
                        </span>
                        <div className="h-px flex-1 bg-slate-200"></div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleIconButton
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                setError("Google registration failed");
                            }}
                        />
                    </div>
                </form>

                <p className="mt-5 text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link
                        className="font-semibold text-indigo-600 hover:underline"
                        to="/login"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;