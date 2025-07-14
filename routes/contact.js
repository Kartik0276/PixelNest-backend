const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../controllers/contactController');

// POST /api/v1/contact - Send contact form message
router.post('/', sendContactEmail);

// GET /api/v1/contact/test - Test route
// router.get('/test', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Contact route is working!',
//     env: {
//       mailUser: process.env.MAIL_USER ? 'Set' : 'Not set',
//       mailPass: process.env.MAIL_PASS ? 'Set' : 'Not set',
//       adminEmail: process.env.ADMIN_EMAIL ? 'Set' : 'Not set'
//     }
//   });
// });

module.exports = router;
