const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const articleController = require('../controllers/articleController');

// Import middleware xác thực và phân quyền
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Cấu hình multer lưu file vào 'uploads/'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });



//  Công khai
router.get('/search', articleController.searchArticlesByTitle);
router.get('/:id', articleController.getArticleById);
router.get('/', articleController.getArticles);

//  Chỉ staff (hoặc thêm 'admin' nếu muốn) được thêm/sửa/xoá bài viết
router.post(
  '/',
  authenticate,
  authorize(['manager']), 
  upload.single('image'),
  articleController.createArticle
);

router.put(
  '/:id',
  authenticate,
  authorize(['manager']),
  upload.single('image'),
  articleController.updateArticle
);

router.delete(
  '/:id',
  authenticate,
  authorize(['manager']),
  articleController.deleteArticle
);

module.exports = router;
