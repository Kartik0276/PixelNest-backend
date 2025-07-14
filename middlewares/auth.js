const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        // const authHeader = req.headers.authorization;
        // if (!authHeader || !authHeader.startsWith("Bearer ")) {
        //     return res.status(401).json({ message: "No token provided" });
        // }

        // const token = authHeader.split(" ")[1];



        //get the token from the cookie
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // 2. Verify token
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        console.log("decoded data:", decodedData);   

        // 3. Find user , "-password" means exclude password from the result
        const rootUser = await User.findById(decodedData.id).select("-password");
        if (!rootUser) {
            return res.status(401).json({ message: "User not found" });
        }

        // 4. Attach user info to request object
        req.user = rootUser;
        console.log("root user:", rootUser);  

        // 5. Go to next middleware
        next();
    } catch (error) {
        console.log("Auth Error:", error);
        res.status(401).json({
            message: "Unauthorized",
            error: error.message
        });
    }
};
