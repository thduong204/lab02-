const express = require('express');
const router = express.Router();
const blogFavoritesController = require('../controllers/blogFavoritesController');
const { authenticate } = require('../middlewares/authMiddleware');


router.get('/search', authenticate, blogFavoritesController.getFavoriteByTitle);
router.delete('/delete/:id', authenticate, blogFavoritesController.deleteFavoriteById);
router.post('/', authenticate, blogFavoritesController.addFavorite);
router.get('/', authenticate, blogFavoritesController.getFavoriteBlogsByUserId);

module.exports = router;
