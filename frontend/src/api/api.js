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

//orders
export const createOrder = (orderData) => {
    return api.post("/orders", orderData);
};
export const getOrders = (filters = {}) => {
    return api.get("/orders", {
        params: filters
    });
};
export const getOrderById = (id) => {
    return api.get(`/orders/${id}`);
};
export const cancelOrder = (id) => {
    return api.put(`/orders/${id}/cancel`);
};
export const fillOrder = (id, data = {}) => {
    return api.put(`/orders/${id}/fill`, data);
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
export const assignAlert = (id, assignmentData) => {
    return api.put(`/alerts/${id}/assign`, assignmentData);
};
export const addAlertComment = (id, commentData) => {
    return api.post(`/alerts/${id}/comments`, commentData);
};
export const updateAlertPriority = (id, priorityData) => {
    return api.put(`/alerts/${id}/priority`, priorityData);
};
export const getMyAssignedAlerts = (filters = {}) => {
    return api.get("/alerts/assigned/me", {
        params: filters
    });
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

//get and update riskrules
export const getRiskRules = (filters = {}) => {
    return api.get("/risk-rules", {
        params: filters
    });
};

export const updateRiskRule = (id, ruleData) => {
    return api.put(`/risk-rules/${id}`, ruleData);
};

//forgot password
export const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", { email });
}
//reset password
export const resetPassword = (token, newPassword) => {
    return api.post(`/auth/reset-password/${token}`, { password: newPassword });
}

// some get apis
export const getRuleTriggerSummary = () => {
    return api.get("/dashboard/rule-trigger-summary");
};

export const getBlockedTradeSummary = () => {
    return api.get("/dashboard/blocked-trade-summary");
};

export const getRecentRiskEvents = () => {
    return api.get("/dashboard/recent-risk-events");
};

//members page
export const getAdminMembers = async () => {
    return await api.get("/admin/members");
};

export const updateAdminMemberRole = async (memberId, role) => {
    return await api.patch(`/admin/members/${memberId}/role`, {
        role
    });
};

export const deleteAdminMember = async (memberId) => {
    return await api.delete(`/admin/members/${memberId}`);
};

export const getAdminAuditLogs = (filters = {}) => {
    return api.get("/admin/audit-logs", {
        params: filters
    });
};

export const getEngineHealth = () => {
    return api.get("/system/engine-health");
};

export const runRiskAudit = () => {
    return api.post("/risk-audit/run");
};

export const getRiskAuditResults = (filters = {}) => {
    return api.get("/risk-audit/results", {
        params: filters
    });
};
//for ai embedding
export const explainAlertWithAI = (alertId) => {
    return api.post(`/ai/alerts/${alertId}/explain`);
};

export const generateInvestigationSummary = (alertId) => {
    return api.post(`/ai/alerts/${alertId}/investigation-summary`);
};

export default api;
