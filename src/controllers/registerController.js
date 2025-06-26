const db = require('../../config/db');

exports.register = async (req, res) => {
  const {
    name, cccd, dob, gender, email,
    password, blood_group_id, health_status, last_donation_date, weight
  } = req.body;

  const role = 'member';

  // 1. Kiểm tra thiếu trường bắt buộc
  if (!name || !cccd || !dob || !gender || !email || !password || !weight) {
    return res.status(400).json({ error: 'Missing required info' });
  }

  // 2. Kiểm tra mật khẩu không chứa khoảng trắng và không rỗng
  if (typeof password !== 'string' || !password.trim() || password.includes(' ')) {
    return res.status(400).json({ error: 'Password must not contain spaces and cannot be empty' });
  }

  try {
    const toSQLDate = (dmy) => {
      const [d, m, y] = dmy.split('/');
      return `${y}-${m}-${d}`;
    };

    const birth_date = toSQLDate(dob);
    const last_donation = last_donation_date ? toSQLDate(last_donation_date) : null;
    const now = new Date().toISOString().split('T')[0];
    if (last_donation && last_donation > now) {
      return res.status(400).json({ error: 'Future date not allowed' });
    }

    const ready_date = last_donation
      ? new Date(new Date(last_donation).getTime() + 90 * 86400000).toISOString().split('T')[0]
      : null;

    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight < 30 || numericWeight > 200) {
      return res.status(400).json({ error: 'Invalid weight' });
    }

    const columns = [
      'user_id', 'full_name', 'birth_date', 'gender', 'email',
      ...(blood_group_id !== null ? ['blood_group_id'] : []),
      'password_hash', 'role', 'health_status', 'last_donation_date',
      'ready_to_donate_date', 'weight', 'created_at', 'updated_at'
    ];

    const values = [
      cccd, name, birth_date, gender, email,
      ...(blood_group_id !== null ? [blood_group_id] : []),
      password, role, health_status, last_donation, ready_date, weight,
      new Date(), new Date()
    ];

    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO accounts (${columns.join(', ')}) VALUES (${placeholders})`;

    db.query(sql, values, (err) => {
      if (err) {
        console.error('DB insert error:', err);
        return res.status(500).json({ error: 'Insert failed' });
      }
      res.json({ success: true, message: 'Registration successful' });
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
