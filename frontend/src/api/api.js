import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const registerUser = (userData) => {
    return api.post("/auth/register", userData);
};

export const loginUser = (loginData) => {
    return api.post("/auth/login", loginData);
};

export const getMe = () => {
    return api.get("/auth/me");
};

export const googleLoginUser = (tokenId) => {
    return api.post("/auth/google", { tokenId });
};
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

//csv upload
export const uploadTradesCSV = (file) => {
    const formData = new FormData();

    formData.append("file", file);

    return api.post("/trades/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
};

//forgot password
export const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", { email });
}
//reset password
export const resetPassword = (token, newPassword) => {
    return api.post(`/auth/reset-password/${token}`, { password: newPassword });
}
export default api;