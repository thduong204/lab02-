const { authenticate } = require('../middlewares/authMiddleware');
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');


router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, profileController.updateProfile);
router.delete('/', authenticate, profileController.deleteProfileFields);
module.exports = router;