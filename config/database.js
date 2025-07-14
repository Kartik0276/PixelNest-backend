const mongoose = require("mongoose");
require('dotenv').config();



exports.connectDB = async() => {
    await mongoose.connect(process.env.MONGODB_URI).then(() => {
        console.log("🟢 Database connected successfully");
    }).catch((err) => {
        console.log("🔴 Database connection failed", err);
    })
}