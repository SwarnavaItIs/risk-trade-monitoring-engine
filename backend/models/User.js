const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: function () {
                // Password is required if the user is not registering via Google OAuth
                return !this.googleId;
            }
        },
        googleId: {
            type: String,
            default: ""
        },
        authProvider: {
            type: String,
            enum: ["LOCAL", "GOOGLE", "BOTH"],
            default: "LOCAL"
        },
        role: {
            type: String,
            enum: ["ADMIN", "ANALYST"],
            default: "ANALYST"
        },
        status: {
            type: String,
            enum: ["ACTIVE", "SUSPENDED"],
            default: "ACTIVE"
        },
        profilePhoto: {
            type: String,
            default: ""
        },
        passwordResetToken: {
            type: String,
            default: ""
        },

        passwordResetExpires: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);