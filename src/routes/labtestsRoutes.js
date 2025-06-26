const express = require('express');
const router = express.Router();
const labtestsController = require('../controllers/labtestsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Chỉ staff mới được thực hiện các thao tác labtests
router.get('/me', authenticate, labtestsController.getMyLabTests);
router.post('/', authenticate, authorize(['staff']), labtestsController.addLabTest);
router.get('/:user_id', authenticate, authorize(['staff']), labtestsController.getLabTestsByUser);
router.put('/:lab_test_id', authenticate, authorize(['staff']), labtestsController.updateLabTest);

module.exports = router;