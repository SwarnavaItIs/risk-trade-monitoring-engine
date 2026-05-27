import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-title">
                Risk Trade Monitoring Engine
            </div>

            <div className="navbar-links">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/trades">Trades</Link>
                <Link to="/alerts">Alerts</Link>
            </div>
        </nav>
    );
};

export default Navbar;