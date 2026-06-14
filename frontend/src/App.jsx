import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import BounceIndicator from "./components/BounceIndicator";
import ScrollToTop from "./components/ScrollToTop";

import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Orders from "./pages/Orders";
import Alerts from './pages/Alerts';
import AlertDetails from './pages/AlertDetails';
import CsvUpload from "./pages/CsvUpload";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RiskRules from "./pages/RiskRules";
import Members from "./pages/Members";
import AuditLogs from "./pages/AuditLogs";
import SystemHealth from "./pages/SystemHealth";
import RiskAudit from "./pages/RiskAudit";

const ProtectedLayout = ({ children }) => {
    return (
        <ProtectedRoute>
            <Navbar />

            <main className="pt-24">
                {children}
            </main>

            <BounceIndicator />
        </ProtectedRoute>
    );
};

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user"));
    }
    catch {
        return null;
    }
};

const AdminLayout = ({ children }) => {
    const user = getStoredUser();

    if (user?.role !== "ADMIN") {
        return <Navigate to="/dashboard" replace />;
    }

    return <ProtectedLayout>{children}</ProtectedLayout>;
};

const App = () => {
    return (
        <Router>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Navigate to="/Dashboard" />} />

                <Route path="/admin/members" element={<Members />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                
                <Route path="/dashboard" element={
                    <ProtectedLayout>
                        <Dashboard />
                    </ProtectedLayout>
                } />

                <Route path="/trades" element={
                    <ProtectedLayout>
                        <Trades />
                    </ProtectedLayout>
                } />

                <Route path="/orders" element={
                    <ProtectedLayout>
                        <Orders />
                    </ProtectedLayout>
                } />

                <Route path="/alerts" element={
                    <ProtectedLayout>
                        <Alerts />
                    </ProtectedLayout>
                } />

                <Route path="/my-alerts" element={
                    <ProtectedLayout>
                        <Alerts assignedToMe />
                    </ProtectedLayout>
                } />

                <Route path="/alerts/:id" element={
                    <ProtectedLayout>
                        <AlertDetails />
                    </ProtectedLayout>
                } />

                <Route path="/csv-upload" element={
                    <ProtectedLayout>
                        <CsvUpload />
                    </ProtectedLayout>
                } />

                <Route
                    path="/risk-rules"
                    element={
                        <ProtectedLayout>
                            <RiskRules />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/admin/audit-logs"
                    element={
                        <ProtectedLayout>
                            <AuditLogs />
                        </ProtectedLayout>
                    }
                />

                <Route
                    path="/admin/system-health"
                    element={
                        <AdminLayout>
                            <SystemHealth />
                        </AdminLayout>
                    }
                />

                <Route
                    path="/admin/risk-audit"
                    element={
                        <AdminLayout>
                            <RiskAudit />
                        </AdminLayout>
                    }
                />
                
                <Route
                    path="/profile"
                    element={
                        <ProtectedLayout>
                            <Profile />
                        </ProtectedLayout>
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;
