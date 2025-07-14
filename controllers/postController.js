const Post = require('../models/Post');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// ✅ Helper to check supported image types
function isFileTypeSupported(supportedTypes, type) {
    return supportedTypes.includes(type);
}

// ✅ Upload file to Cloudinary
async function uploadFileToCloudinary(file, folder, quality) {
    const options = { folder };

    if (quality) {
        options.quality = quality;
    }

    options.resource_type = "auto"; // Detects image/video/etc automatically
    return await cloudinary.uploader.upload(file.tempFilePath, options);
}

// ✅ Create post controller
exports.createPost = async (req, res) => {
    try {
        const { title, description } = req.body;
        const file = req.files?.imageFile;

        // Basic validation
        if (!title || !file || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and image are required"
            });
        }

        // Check supported file types
        const supportedTypes = ["jpg", "jpeg", "png", "webp"];
        const fileType = file.name.split('.').pop().toLowerCase();

        if (!isFileTypeSupported(supportedTypes, fileType)) {
            return res.status(400).json({
                success: false,
                message: "File format not supported"
            });
        }

        // Upload image to Cloudinary
        const uploadResponse = await uploadFileToCloudinary(file, "Kartik");

        // Create post in DB
        const newPost = await Post.create({
            title,
            description,
            imagePublicId: uploadResponse.public_id,
            imageUrl: uploadResponse.secure_url,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post: newPost,
        });

    } catch (error) {
        console.error("Create Post Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};


// ✅ edit post
exports.editPost = async (req, res) => {
    try {
        const { title, description } = req.body;
        const file = req.files?.imageFile;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Ensure the logged-in user is the creator
        if (post.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can't edit this post"
            });
        }

        if (title) {
            post.title = title;
        }

        if (description) {
            post.description = description;
        }

        if (file) {
            // Check supported file types
            const supportedTypes = ["jpg", "jpeg", "png", "webp"];
            // Get file extension
            const fileType = file.name.split('.').pop().toLowerCase();

            if (!isFileTypeSupported(supportedTypes, fileType)) {
                return res.status(400).json({
                    success: false,
                    message: "File format not supported"
                });
            }

            // Upload image to Cloudinary
            const uploadResponse = await uploadFileToCloudinary(file, "Kartik");

            // Delete old image from Cloudinary
            await cloudinary.uploader.destroy(post.imagePublicId);

            // Update post in DB
            post.imagePublicId = uploadResponse.public_id;
            post.imageUrl = uploadResponse.secure_url;
        }

        await post.save();

        res.status(200).json({
            success: true,
            message: "Post updated successfully",
            post,
        });

    } catch (error) {
        console.error("Edit Post Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};


// ✅ Delete post
exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Ensure the logged-in user is the creator
        if (post.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can't delete this post"
            });
        }

        // Delete image from Cloudinary
        await cloudinary.uploader.destroy(post.imagePublicId);

        await post.deleteOne();

        res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });

    } catch (error) {
        console.error("Delete Post Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};

// ✅ Get my posts
exports.getMyPosts = async (req, res) => {
    try {
        console.log("Authenticated User ID:", req.user._id); // already an ObjectId

        const posts = await Post.find({ createdBy: req.user._id })
            .populate("createdBy", "name email")
            .populate("comments.user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            posts,
        });
    } catch (error) {
        console.error("Get My Posts Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};

// ✅ get single post by ID
exports.getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const post = await Post.findById(postId).populate('createdBy', 'name email');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Check if the user is the owner of the post (for edit access)
        const isOwner = post.createdBy._id.toString() === req.user._id.toString();

        res.status(200).json({
            success: true,
            message: "Post fetched successfully",
            post,
            isOwner
        });
    } catch (error) {
        console.error("Get Post By ID Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};


// ✅ like post
exports.togglelikePost = async (req, res) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // take a flag for checking the post the post is liked or disliked by the user
        let flag = false;

        //toggle like
        if (post.likes.includes(req.user._id)) {
            post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());

        } else {
            post.likes.push(req.user._id);
            flag = true;

        }
        await post.save();
        return res.status(200).json({
            success: true,
            message: `${flag ? "The post is liked by the user" : "The post is unliked by the user"} `,
        });

    } catch (error) {
        console.error("Like Post Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong while liking or unlikeing the post",
            error: error.message
        });
    }
}


// ✅ Get all user who like the post
exports.getUserWhoLikedPost = async (req, res) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const users = await Post.findById(postId)
            .select("likes") // return only the `likes` field
            .populate("likes", "name email"); // populate only `name` and `email` of liked users

        console.log(users);


        res.status(200).json({
            success: true,
            users,
        });

    } catch (error) {
        console.error("Get User Who Liked Post Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}


// ✅  create comment on post
exports.commentOnPost = async (req, res) => {
    try {
        const postId = req.params.id;

        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }

        const { comment } = req.body;

        if (!comment || comment.trim().length < 1) {
            return res.status(400).json({
                success: false,
                message: "Comment is required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Push the new comment object to the comments array
        post.comments.push({
            user: req.user._id,
            text: comment.trim()
        });

        await post.save();

        return res.status(200).json({
            success: true,
            message: "Comment added successfully"
        });

    } catch (error) {
        console.error("Comment Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}


// ✅  delete comment on post
exports.deleteCommentOnPost = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        console.log(postId, commentId);

        if (!postId || !commentId) {
            return res.status(400).json({
                success: false,
                message: "Post ID and Comment ID are required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Find the comment to delete
        const commentToDelete = post.comments.find(comment => comment._id.toString() === commentId);

        if (!commentToDelete) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }

        // Ensure the logged-in user is the creator of the comment
        if (commentToDelete.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can't delete this comment"
            });
        }

        // Remove the comment from the post's comments array
        post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);

        await post.save();

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}






// edit comment
exports.editComment = async(req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { comment } = req.body;

        if (!postId || !commentId) {
            return res.status(400).json({
                success: false,
                message: "Post ID and Comment ID are required"
            });
        }

        if (!comment || comment.trim().length < 1) {
            return res.status(400).json({
                success: false,
                message: "Comment is required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        // Find the comment to edit
        const commentToEdit = post.comments.find(comment => comment._id.toString() === commentId);

        if (!commentToEdit) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }

        // Ensure the logged-in user is the creator of the comment
        if (commentToEdit.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can't edit this comment"
            });
        }

        commentToEdit.text = comment.trim();
        commentToEdit.status = "edited";
        await post.save();

        return res.status(200).json({
            success: true,
            message: "Comment edited successfully"
        }); 
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}


// get all comments of a post
exports.getCommentsOfPost = async(req, res) => {
    try {
        const postId = req.params.id;
        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required"
            });
        }
        isPostPresent = await Post.findById(postId);
        if (!isPostPresent) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const post = await Post.findById(postId)
            .select("comments")
            .populate("comments.user", "name email");

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        const comments = post.comments;

        res.status(200).json({
            success: true,
            comments,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}   


// get all posts
exports.getAllPosts = async(req, res) => {
    try {
        const allPosts = await Post.find({})
            .populate("createdBy", "name email")
            .populate("comments.user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            allPosts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}