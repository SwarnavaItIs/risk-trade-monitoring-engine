import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import BounceIndicator from "./components/BounceIndicator";

import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Alerts from './pages/Alerts';
import AlertDetails from './pages/AlertDetails';
import CsvUpload from "./pages/CsvUpload";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const ProtectedLayout = ({ children }) => {
    return (
        <ProtectedRoute>
            <Navbar />
            {children}
            <BounceIndicator />
        </ProtectedRoute>
    );
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/Dashboard" />} />

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

                <Route path="/alerts" element={
                    <ProtectedLayout>
                        <Alerts />
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