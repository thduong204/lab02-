//eventRegistrationsRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventRegistrationsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');


// Đúng thứ tự
router.post('/register', authenticate, authorize(['member']), ctrl.register);

// ⚠ Đưa lên TRƯỚC
router.get('/my', authenticate, authorize(['member']), ctrl.listMyRegistrations);

// Lúc này mới được để :event_id
router.get('/:event_id', authenticate, authorize(['staff', 'manager', 'admin']), ctrl.listByEvent);

router.put('/:registration_event_id', authenticate, authorize(['manager', 'staff', 'admin']), ctrl.updateRegistration);


module.exports = router;


