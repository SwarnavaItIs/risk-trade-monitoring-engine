const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not configured");
        }

        mongoose.set("bufferCommands", false);

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000
        });

        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
