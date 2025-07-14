const express = require('express');
const { connectDB } = require('./config/database');
const cookieParesr = require('cookie-parser')


//env file
require('dotenv').config();

const app = express();

const cors = require('cors');

// Use this *before* your routes
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
].filter(Boolean); // Remove undefined values

// For production, allow any origin if CLIENT_URL is not set (temporary fix)
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL
        ? true  // Allow all origins in production if CLIENT_URL not set
        : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));


//middlewares 
app.use(express.json());
app.use(cookieParesr());




const fileUpload = require('express-fileupload');
app.use(fileUpload(
    {
        useTempFiles: true,
        tempFileDir: '/tmp/'
    }
));

//cloud se connect karna h
const cloudinary = require('./config/cloudinary')
cloudinary.cloudinaryConnect()



//auth middleware
const { authenticate } = require('./middlewares/auth');


//routes
//auth routes signup and login
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);

// contact routes
const contactRoutes = require('./routes/contact');
app.use('/api/v1/contact', contactRoutes);

// protected routes
const postRoutes = require('./routes/post');
app.use('/api/v1/posts', postRoutes);








app.get('/', (req, res) => {
    res.send('Hello World!');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});