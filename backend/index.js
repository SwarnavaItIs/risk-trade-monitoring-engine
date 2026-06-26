const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
dotenv.config();

const { protect } = require("./middleware/authMiddleware");
const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true
    })
);
app.use(express.json());

const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const alertRoutes = require("./routes/alertRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const orderRoutes = require("./routes/orderRoutes");
const riskRuleRoutes = require("./routes/riskRuleRoutes");
const adminRoutes = require("./routes/adminRoutes");
const systemRoutes = require("./routes/systemRoutes");
const riskAuditRoutes = require("./routes/riskAuditRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.get("/", (req, res) => {
    res.send("Risk Trade Monitoring Engine Backend Running");
});

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trades", protect, tradeRoutes);
app.use("/api/orders", protect, orderRoutes);
app.use("/api/alerts", protect, alertRoutes);
app.use("/api/dashboard", protect,  dashboardRoutes);
app.use("/api/risk-rules", protect, riskRuleRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/system", protect, systemRoutes);
app.use("/api/risk-audit", protect, riskAuditRoutes);
app.use("/api/ai", protect, aiRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Server startup failed. MongoDB connection is required.");
        console.error(error.message);
        process.exit(1);
    }
};

startServer();
