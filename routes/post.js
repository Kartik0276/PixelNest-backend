const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');

const { createPost, editPost, deletePost, getMyPosts, getPostById, togglelikePost, getUserWhoLikedPost, commentOnPost,
 deleteCommentOnPost, editComment, getCommentsOfPost, getAllPosts } = require('../controllers/postController');

// router.get('/test', authenticate, (req, res) => {
//   res.send(`Hello ${req.user.name}, you are authenticated`);
// });


// PROTECTED ROUTES
router.post('/createPost', authenticate, createPost);
router.put('/editPost/:id', authenticate, editPost);
router.delete('/deletePost/:id', authenticate, deletePost);
router.get('/myPosts', authenticate, getMyPosts);
router.get('/getPost/:id', authenticate, getPostById);
router.put('/likeToggle/:id', authenticate, togglelikePost);
router.post('/comment/:id', authenticate, commentOnPost);
router.delete('/comment/:postId/delete/:commentId', authenticate, deleteCommentOnPost);
router.put('/comment/:postId/edit/:commentId', authenticate, editComment);
router.get('/getUser/:id',authenticate, getUserWhoLikedPost);
router.get('/getUserComments/:id', getCommentsOfPost);

// PUBLIC ROUTE
router.get('/allPosts', getAllPosts);


module.exports = router;