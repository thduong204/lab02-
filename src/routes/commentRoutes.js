const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post('/', authenticate, commentController.createComment);
router.get('/:articleId', commentController.getCommentsByArticleId);
router.put('/:commentId', authenticate, commentController.updateComment);
router.delete('/:commentId', authenticate, commentController.deleteComment);
module.exports = router;
