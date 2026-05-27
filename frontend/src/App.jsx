import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Alerts from './pages/Alerts';
import AlertDetails from './pages/AlertDetails';

const App = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to="/Dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/alerts/:id" element={<AlertDetails />} />
            </Routes>
        </Router>
    );
};

export default App;