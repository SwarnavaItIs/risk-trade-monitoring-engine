import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav className="flex h-16 items-center justify-between bg-slate-950 px-8 text-white shadow">
            <div className="text-lg font-bold tracking-wide">
                Risk Trade Monitoring Engine
            </div>

            <div className="flex gap-6 text-sm font-medium">
                <Link className="transition hover:text-blue-300" to="/dashboard">
                    Dashboard
                </Link>

                <Link className="transition hover:text-blue-300" to="/trades">
                    Trades
                </Link>

                <Link className="transition hover:text-blue-300" to="/alerts">
                    Alerts
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;