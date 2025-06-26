const express = require('express');
const router = express.Router();
const bloodRequestsController = require('../controllers/bloodRequestsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// STAFF
router.post('/', authenticate, authorize(['staff']), bloodRequestsController.createRequest);
router.put('/:id', authenticate, authorize(['staff']), bloodRequestsController.updateRequest);
router.delete('/:id', authenticate, authorize(['staff']), bloodRequestsController.deleteRequest);
router.get('/', authenticate, authorize(['staff', 'admin']), bloodRequestsController.getAllRequests);

// Tìm kiếm member để tạo yêu cầu
router.get('/search/members', authenticate, authorize(['staff']), bloodRequestsController.searchMembersForRequest);
router.get('/member/:cccd', authenticate, authorize(['staff']), bloodRequestsController.getMemberByCCCD);

// MEMBER
router.get('/my', authenticate, authorize(['member']), bloodRequestsController.getMyRequests);

module.exports = router;
