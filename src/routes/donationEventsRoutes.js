const express = require('express');
const router = express.Router();
const donationEventsController = require('../controllers/donationEventsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');


// Tìm kiếm sự kiện theo tên
router.get('/events/search', donationEventsController.searchEventsByName);

// Lấy 1 sự kiện cụ thể
router.get('/:id', donationEventsController.getEvent);
// Lấy tất cả sự kiện
router.get('/', donationEventsController.listEvents);

// Tạo sự kiện
router.post(
  '/',
  authenticate,
  authorize(['manager','staff' ]),
  donationEventsController.createEvent
);

// Cập nhật sự kiện
router.put(
  '/:id',
  authenticate,
  authorize(['manager','staff']),
  donationEventsController.updateEvent
);

// Xóa sự kiện
router.delete(
  '/:id',
  authenticate,
  authorize(['manager','staff' ]),
  donationEventsController.deleteEvent
);

module.exports = router;
