const testAuth = (req, res) => {
    res.status(200).json({
        message: "Auth route is working"
    });
};

const registerUser = (req, res) => {
    res.status(201).json({
        message: "Register user route will be built later"
    });
};

const loginUser = (req, res) => {
    res.status(200).json({
        message: "Login user route will be built later"
    });
};

module.exports = {
    testAuth,
    registerUser,
    loginUser
};