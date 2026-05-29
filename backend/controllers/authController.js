const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
            return res.status(400).json({ message: "Please provide name, email and password" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const role = "ANALYST";
        if (adminSecret) {
            if (adminSecret === process.env.ADMIN_REGISTRATION_SECRET) {
                role = "ADMIN";
            } else {
                return res.status(400).json({ message: "Invalid admin registration secret" });
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "ANALYST"
        });

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",
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
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Server error" });
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
    getMe
};