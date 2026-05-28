import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <nav className="flex h-16 items-center justify-between bg-slate-950 px-8 text-white shadow">
            <div className="text-lg font-bold tracking-wide">
                Risk Trade Monitoring Engine
            </div>

            <div className="flex items-center gap-6 text-sm font-medium">
                <Link className="transition hover:text-blue-300" to="/dashboard">
                    Dashboard
                </Link>

                <Link className="transition hover:text-blue-300" to="/trades">
                    Trades
                </Link>

                <Link className="transition hover:text-blue-300" to="/alerts">
                    Alerts
                </Link>

                <Link className="transition hover:text-blue-300" to="/csv-upload">
                    CSV Upload
                </Link>

                {user && (
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                        {user.role}
                    </span>
                )}

                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold transition hover:bg-red-700"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;