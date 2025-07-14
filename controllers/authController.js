const User = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');

exports.signUpUser = async (req, res) => {
    try {
        let { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide name, email and password'
            })
        }
        const isExistUser = await User.findOne({ email });
        if (isExistUser) {
            return res.status(400).json({
                status: 'fail',
                message: 'User already exists'
            })
        }


        // hash the password
        let hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email : email.toLowerCase(),
            password: hashedPassword
        });

        res.status(201).json({
            status: 'success',
            data: {
                user
            }
        })

    } catch (error) {
        console.log("The errror occurs in authController.js in signup", error.message)
        res.status(400).json({
            status: 'fail',
            message: error.message
        })
    }
}

// login

exports.loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;
        console.log("email and password is", email, password)
        if (!email || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide email and password'
            })
        }
        email = email.toLowerCase();
        const user = await User.findOne( {email} );
        console.log("user is", user)
        if (!user) {
            console.log("user is not found")
            return res.status(400).json({
                status: 'fail',
                message: 'User not found'
            })
        }
        // console.log("user is valid")

        // compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid credentials'
            })
        }

        // crate payload
        const payload = {
            email: user.email,
            id: user._id,
            name: user.name
        }

        // create token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        let options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true
        }
        res.cookie("token", token, options).status(200).json({
            success: true,
            message: "Login successful",
            token,
            user
        })
    } catch (error) {
        console.log("The errror occurs in authController.js in login", error.message)
        res.status(400).json({
            status: 'fail',
            message: error.message
        })
    }
}

// logout
exports.logoutUser = async (req, res) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
        }).status(200).json({
            success: true,
            message: "Logout successful"
        })
    } catch (error) {
        console.log("The errror occurs in authController.js in logout", error.message)
        res.status(400).json({
            status: 'fail',
            message: error.message
        })
    }
}

// get user details
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        console.log("The errror occurs in authController.js in getProfile", error.message)
        res.status(400).json({
            status: 'fail',
            message: error.message
        })
    }
}