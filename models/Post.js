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

    // const info = await transporter.sendMail({
    //   from: process.env.MAIL_USER,
    //   to: populatedDoc.createdBy.email,
    //   subject: "New file uploaded to Cloudinary",
    //   html: `
    //     <h1>Hello ${populatedDoc.createdBy.name},</h1>
    //     <p>Your file has been successfully uploaded.</p>
    //     <p>Click <a href="${populatedDoc.imageUrl}">here</a> to view your file.</p>
    //     <p>Thank you!</p>
    //   `,
    // });

    const info = await transporter.sendMail({
  from: `"PixelNest 📸" <${process.env.MAIL_USER}>`, // branded sender name
  to: populatedDoc.createdBy.email,
  subject: "🎉 Your new post is live on PixelNest!",
  html: `
    <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#FF9800;">Hello ${populatedDoc.createdBy.name},</h2>
      <p>Great news! 🎊 Your post has been successfully uploaded to <strong>PixelNest</strong>.</p>
      
      <p>
        <a href="${process.env.CLIENT_URL}/post/${doc._id}" 
           style="display:inline-block; padding:10px 20px; margin:10px 0; 
                  background: linear-gradient(90deg, #FFD54F, #FF9800); 
                  color:#fff; text-decoration:none; 
                  border-radius:5px; font-weight:bold;">
          View Your Post
        </a>
      </p>

      <p>You can always return to PixelNest to explore, share, and inspire others.</p>
      <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;" />
      <p style="font-size:14px; color:#777; text-align:center;">
        Sent with ❤️ by <strong>PixelNest</strong><br>
        Capture • Share • Inspire<br>
        <a href="${process.env.CLIENT_URL}" 
           style="color:#FF9800; text-decoration:none;">Visit PixelNest</a>
      </p>
    </div>
  `,
});


    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
});

module.exports = mongoose.model("Post", postSchema);
