const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const API_URL = 'http://localhost:3000/api';
router.post('/login', authController.login);

module.exports = router;
