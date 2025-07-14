const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
};

// Send contact form email
exports.sendContactEmail = async (req, res) => {
  try {
    console.log('📧 Contact form submission received:', req.body);
    const { name, email, subject, message, sendCopy } = req.body;

    // Validations
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long"
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters long"
      });
    }

    // Save to database
    const contactMessage = new Contact({
      name,
      email,
      subject,
      message,
      sendCopy
    });

    await contactMessage.save();
    console.log('✅ Contact message saved to database:', contactMessage._id);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Message sent successfully! We'll get back to you soon.",
      id: contactMessage._id
    });

    // Send emails asynchronously
    setImmediate(async () => {
      try {
        await sendEmailNotifications(name, email, subject, message, sendCopy);
        console.log('✅ Email notifications sent');
      } catch (emailErr) {
        console.error('⚠️ Email sending failed:', emailErr.message);
      }
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send email notifications
const sendEmailNotifications = async (name, email, subject, message, sendCopy) => {
  const transporter = createTransporter();

  // Email to admin
  const adminMailOptions = {
    from: `"${name} via Image Gallery" <${process.env.MAIL_USER}>`,  // display name
    to: process.env.ADMIN_EMAIL || process.env.MAIL_USER,
    replyTo: email,  // reply goes to actual sender
    subject: `Contact Form: ${subject}`,
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <p><strong>Send Copy:</strong> ${sendCopy ? 'Yes' : 'No'}</p>
      <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
    `
  };
  await transporter.sendMail(adminMailOptions);

  // Confirmation email to user
  if (sendCopy) {
    const confirmationMailOptions = {
      from: `"Image Gallery" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Message Received - Image Gallery',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message about "<strong>${subject}</strong>" and will get back to you soon.</p>
        <p>Best regards,<br>Image Gallery Team</p>
      `
    };
    await transporter.sendMail(confirmationMailOptions);
  }
};
