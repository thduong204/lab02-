const db = require('../../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error('ERROR: SECRET_KEY is not defined in environment variables');
  process.exit(1);
}

exports.login = (req, res) => {
  const { cccd, password } = req.body;
  if (!cccd || !password) {
    return res.status(400).json({ error: 'CCCD and password are required' });
  }

  const sql = 'SELECT * FROM accounts WHERE user_id = ?';
  db.query(sql, [cccd], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    if (results.length === 0 || results[0].password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];

    // Tạo JWT token
    const token = jwt.sign({
      id: user.user_id,
      name: user.full_name,
      role: user.role
    }, SECRET_KEY, { expiresIn: '1d' });

    res.json({
  success: true,
  token,
  user: {
    id: user.user_id,
    name: user.full_name,
    role: user.role
  }
});
  });
};
