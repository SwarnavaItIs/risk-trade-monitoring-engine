import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api"
});

//dashboard
export const getDashboardSummary = () => {
    return api.get("/dashboard/summary");
};
export const getAlertsBySeverity = () => {
    return api.get("/dashboard/alerts-by-severity");
};

export const getAlertsByType = () => {
    return api.get("/dashboard/alerts-by-type");
};

export const getTopRiskyTraders = () => {
    return api.get("/dashboard/top-risky-traders");
};

export const getTopTradedStocks = () => {
    return api.get("/dashboard/top-traded-stocks");
};

export const getRiskTrend = () => {
    return api.get("/dashboard/risk-trend");
};

//trades
export const getTrades = () => {
    return api.get("/trades");
};
export const createTrade = (tradeData) => {
    return api.post("/trades", tradeData);
};

//alerts
export const getAlerts = (filters = {}) => {
    return api.get("/alerts", {
        params: filters
    });
};
export const getAlertById = (id) => {
    return api.get(`/alerts/${id}`);
};
export const updateAlertStatus = (id, updateData) => {
    return api.put(`/alerts/${id}/status`, updateData);
};


export default api;