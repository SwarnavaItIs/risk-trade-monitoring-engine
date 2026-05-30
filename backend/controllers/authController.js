const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require("crypto");

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email"
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

        await user.save();

        res.status(200).json({
            message: "Password reset token generated successfully",
            data: {
                resetToken,
                expiresIn: "15 minutes"
            }
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to generate password reset token",
            error: error.message
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                message: "New password is required"
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset token"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.passwordResetToken = "";
        user.passwordResetExpires = undefined;

        if (user.authProvider === "GOOGLE") {
            user.authProvider = "BOTH";
        }

        await user.save();

        res.status(200).json({
            message: "Password reset successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to reset password",
            error: error.message
        });
    }
};

const generateToken = (userId) => {
    return jwt.sign(
        { id:userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d"}
    );
}

const registerUser = async (req, res) => {
    try {
        const { name, email, password, adminSecret } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email, and password are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "An account with this email already exists. Please login instead."
            });
        }

        let role = "ANALYST";

        if (adminSecret) {
            if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
                return res.status(403).json({
                    message: "Invalid admin registration secret"
                });
            }

            role = "ADMIN";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role
        });

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profilePhoto: user.profilePhoto || ""
                }
            }
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "An account with this email already exists. Please login instead."
            });
        }

        res.status(500).json({
            message: "Failed to register user",
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    profilePhoto: user.profilePhoto,
                    email: user.email,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const gooleLoginUser = async (req, res) => {
    try {
        const { tokenId } = req.body;

        if (!tokenId) {
            return res.status(400).json({ message: "Google credentials is required" });
        }
        const ticket = await googleClient.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Invalid Google account" });
        }

        if(payload.email_verified !== true) {
            return res.status(400).json({ message: "Google email not verified" });
        }

        let user = await User.findOne({ email: payload.email });

        if (!user) {
            user = await User.create({
                name: payload.name,
                email: payload.email,
                profilePhoto: payload.picture || "",
                googleId: payload.sub,
                authProvider: "GOOGLE",
                role: "ANALYST"
            });
        }
        else{
            if(!user.googleId){
                user.googleId = payload.sub;
                user.authProvider = user.password ? "BOTH" : "GOOGLE";
            }
            
            if(!user.profilePhoto && payload.picture){
                user.profilePhoto = payload.picture;
            }

            await user.save();
        }

        const token = generateToken(user._id);
        res.status(200).json({
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error("Google Authentication Failed!", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getMe = async (req, res) => {
    try {
        res.status(200).json({
            message: "User details fetched successfully",
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    profilePhoto: req.user.profilePhoto,
                    email: req.user.email,
                    role: req.user.role
                }
            }
        });
    }
    catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    gooleLoginUser,
    getMe,
    forgotPassword,
    resetPassword
};