import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

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

                <ThemeToggle />
                
                {user && (
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                        {user.role}
                    </span>
                )}

                {user && (
                    <Link
                        to="/profile"
                        className="flex items-center justify-center rounded-full transition hover:ring-2 hover:ring-indigo-400"
                        title="Profile"
                    >
                        {user.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={user.name}
                                className="size-9 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        )}
                    </Link>
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