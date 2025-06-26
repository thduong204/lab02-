const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const qrController = require('../controllers/qrController');

const upload = multer({ dest: path.join(__dirname, '../uploads') });

router.post('/scan', upload.single('qrImage'), qrController.scanQR);

module.exports = router;