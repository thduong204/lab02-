const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const roleChangeController = require('../controllers/roleChangeController');

// Me gửi yêu cầu
router.post('/request', authenticate, authorize(['member']), roleChangeController.requestRoleChange);
router.get('/my-request', authenticate, roleChangeController.getMyRoleChangeRequestStatus);
// Admin xử lý
router.get('/', authenticate, authorize(['admin']), roleChangeController.getAllRoleChangeRequests);
router.patch('/:id/approve', authenticate, authorize(['admin']), roleChangeController.approveRoleChangeByRequestId);
router.patch('/:id/reject', authenticate, authorize(['admin']), roleChangeController.rejectRoleChange);
module.exports = router;
