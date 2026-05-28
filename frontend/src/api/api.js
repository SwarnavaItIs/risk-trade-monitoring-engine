import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api"
});

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


export const getTrades = () => {
    return api.get("/trades");
};
export const createTrade = (tradeData) => {
    return api.post("/trades", tradeData);
};

export const getAlerts = () => {
    return api.get("/alerts");
};

export const getAlertById = (id) => {
    return api.get(`/alerts/${id}`);
};

export default api;