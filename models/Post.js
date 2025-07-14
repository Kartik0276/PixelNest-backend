const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    maxlength: [100, "Title can't be more than 100 characters"],
  },
  description: {
    type: String,
    maxlength: [500, "Description too long"],
    required: [true, "Description is required"],
  },
  imageUrl: {
    type: String,
    required: [true, "Image URL is required"],
  },
  imagePublicId: {
    type: String,
    required: [true, "Image public ID is required for Cloudinary deletion"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      text: {
        type: String,
        required: [true, "Comment text is required"],
        maxlength: [300, "Comment too long"],
        trim: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["edited", ""],
        default: "",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware: Send email after saving a post
postSchema.post("save", async function (doc) {
  try {
    // Populate createdBy with user's name and email
    const populatedDoc = await doc.populate("createdBy", "name email");

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST, // e.g., smtp.gmail.com
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER, // your email
        pass: process.env.MAIL_PASS, // your app password
      },
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: populatedDoc.createdBy.email,
      subject: "New file uploaded to Cloudinary",
      html: `
        <h1>Hello ${populatedDoc.createdBy.name},</h1>
        <p>Your file has been successfully uploaded.</p>
        <p>Click <a href="${populatedDoc.imageUrl}">here</a> to view your file.</p>
        <p>Thank you!</p>
      `,
    });

    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
});

module.exports = mongoose.model("Post", postSchema);
