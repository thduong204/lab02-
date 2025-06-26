const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const accountsController = require('../controllers/accountsController');

// Chỉ admin mới được đổi quyền
router.patch('/:user_id/role', authenticate, authorize(['admin']), accountsController.updateUserRole);
router.get('/search', authenticate, authorize(['admin','staff']), accountsController.searchUsers);
router.delete('/:user_id', authenticate, authorize(['admin']), accountsController.deleteUser);
router.patch('/:user_id/health-status', authenticate, authorize(['staff']), accountsController.updateUserHealthStatus);
router.get('/', authenticate, authorize(['admin']), accountsController.getAllUsers);
module.exports = router;
