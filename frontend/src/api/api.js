import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api"
});

export const getDashboardSummary = () => {
    return api.get("/dashboard/summary");
};

export const getTrades = () => {
    return api.get("/trades");
};

export const getAlerts = () => {
    return api.get("/alerts");
};

export const getAlertById = (id) => {
    return api.get(`/alerts/${id}`);
};

export default api;