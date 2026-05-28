const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
dotenv.config();
connectDB();

const { protect } = require("./middleware/authMiddleware");
const app = express();

app.use(cors());
app.use(express.json());

const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const alertRoutes = require("./routes/alertRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const tradeRoutes = require("./routes/tradeRoutes");





app.get("/", (req, res) => {
    res.send("Risk Trade Monitoring Engine Backend Running");
});

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trades", protect, tradeRoutes);
app.use("/api/alerts", protect, alertRoutes);
app.use("/api/dashboard", protect,  dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});