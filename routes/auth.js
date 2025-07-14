const express = require('express');
const router = express.Router();

// import handlers form controllers
const { signUpUser, loginUser, logoutUser, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');


// auth router
router.post('/signup', signUpUser);
router.post('/login', loginUser);
router.get('/profile',authenticate, getProfile);
router.get('/logout', logoutUser);


module.exports = router;
