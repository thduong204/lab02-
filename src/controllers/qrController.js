const fs = require('fs');
const { readQR } = require('../utils/qrHelper');

exports.scanQR = async (req, res) => {
  const qrPath = req.file?.path;
  if (!qrPath) return res.status(400).json({ error: 'QR image is required' });

  try {
    const qrRaw = await readQR(qrPath);
    const [cccd, , name, dob, genderRaw] = qrRaw.split('|');
    const gender = genderRaw.toLowerCase() === 'nam' ? 'male' : 'female';

    res.json({ cccd, name, dob, gender });
  } catch (err) {
    res.status(500).json({ error: 'QR scan failed' });
  } finally {
    if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
  }
};