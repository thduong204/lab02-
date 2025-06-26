const db = require('../../config/db');

// Hàm kiểm tra xét nghiệm có "không đạt"
const isFail = (value) => {
  return ["Dương tính", "Phát hiện", "Positive"].includes(value);
};

// 1. Thêm kết quả xét nghiệm (dùng registration_event_id)
exports.addLabTest = (req, res) => {
  const {
    user_id, test_date, notes, registration_event_id, blood_unit_id,
    blood_group,
    hiv_result, hbv_result, hcv_result, syphilis_result,
    malaria_result,
    hemoglobin, hematocrit,
    nat_result
  } = req.body;

  let status_result_blood = 1;
  if (
    isFail(hiv_result) ||
    isFail(hbv_result) ||
    isFail(hcv_result) ||
    isFail(syphilis_result) ||
    isFail(malaria_result) ||
    isFail(nat_result) ||
    hemoglobin < 12.5 ||
    hematocrit < 38
  ) {
    status_result_blood = 0;
  }

  const sql = `INSERT INTO labtests (
    user_id, test_date, notes, blood_unit_id,
    blood_group, hiv_result, hbv_result, hcv_result, syphilis_result,
    malaria_result, hemoglobin, hematocrit, nat_result,
    created_at, status_result_blood
  ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;

  const values = [
    user_id, test_date, notes, blood_unit_id,
    blood_group, hiv_result, hbv_result, hcv_result, syphilis_result,
    malaria_result, hemoglobin, hematocrit, nat_result,
    status_result_blood
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      message: 'Lab test added successfully', 
      lab_test_id: result.insertId, 
      status_result_blood 
    });
  });
};

// 2. Tìm kiếm theo user_id, tên người dùng, tên sự kiện
exports.getLabTestsByUser = (req, res) => {
  const keyword = req.params.user_id;

  const sql = `
  SELECT lt.*, a.full_name, de.event_name, er.units_collected
  FROM labtests lt
  JOIN accounts a ON lt.user_id = a.user_id
  LEFT JOIN event_registrations er ON lt.user_id = er.donor_id
  LEFT JOIN donationevents de ON er.event_id = de.event_id
  WHERE (a.user_id = ? OR a.full_name LIKE ? OR de.event_name LIKE ?)
    AND er.checkin_status = 1
  ORDER BY lt.test_date DESC
`;

  db.query(sql, [keyword, `%${keyword}%`, `%${keyword}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 3. Cập nhật kết quả xét nghiệm
exports.updateLabTest = (req, res) => {
  const lab_test_id = req.params.lab_test_id;
  const {
    test_date, notes, blood_unit_id,
    blood_group,
    hiv_result, hbv_result, hcv_result, syphilis_result,
    malaria_result,
    hemoglobin, hematocrit,
    nat_result
  } = req.body;

  const checkSql = 'SELECT lab_test_id FROM labtests WHERE lab_test_id = ?';
  db.query(checkSql, [lab_test_id], (checkErr, checkRes) => {
    if (checkErr) return res.status(500).json({ error: checkErr.message });
    if (checkRes.length === 0) {
      return res.status(404).json({ error: 'Lab test ID not found' });
    }

    let status_result_blood = 1;
    if (
      isFail(hiv_result) ||
      isFail(hbv_result) ||
      isFail(hcv_result) ||
      isFail(syphilis_result) ||
      isFail(malaria_result) ||
      isFail(nat_result) ||
      hemoglobin < 12.5 ||
      hematocrit < 38
    ) {
      status_result_blood = 0;
    }

    const sql = `UPDATE labtests SET 
      test_date = ?, notes = ?, blood_unit_id = ?,
      blood_group = ?, hiv_result = ?, hbv_result = ?, hcv_result = ?, syphilis_result = ?,
      malaria_result = ?, hemoglobin = ?, hematocrit = ?, nat_result = ?, status_result_blood = ?
      WHERE lab_test_id = ?`;

    const values = [
      test_date, notes, registration_event_id, blood_unit_id,
      blood_group, hiv_result, hbv_result, hcv_result, syphilis_result,
      malaria_result, hemoglobin, hematocrit, nat_result,
      status_result_blood, lab_test_id
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Lab test updated successfully', status_result_blood });
    });
  });
};

// 4. Danh sách xét nghiệm của người dùng đang đăng nhập
exports.getMyLabTests = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT lt.*, a.full_name, er.units_collected
    FROM labtests lt
    JOIN accounts a ON lt.user_id = a.user_id
    JOIN event_registrations er ON lt.user_id = er.donor_id
    WHERE lt.user_id = ? AND er.checkin_status = 1 AND er.registration_status = 1
    ORDER BY lt.test_date DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
