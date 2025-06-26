const db = require('../../config/db');

//  Danh sách thành phần máu hợp lệ
const VALID_COMPONENT_TYPES = [
  'Red Blood Cells',
  'Plasma',
  'Platelets'
];

//  API: Danh sách thành phần máu hợp lệ (tuỳ chọn cho dropdown UI)
exports.getValidComponentTypes = (req, res) => {
  res.json({ valid_component_types: VALID_COMPONENT_TYPES });
};

// Lấy tất cả đơn vị máu
exports.listBloodUnits = (req, res) => {
  db.query(
    `SELECT blood_unit_id, blood_group_id, component_type, status, collection_date, expiry_date
     FROM bloodunits
     ORDER BY collection_date DESC`,
    (err, bloodUnits) => {
      if (err) {
        console.error('Error fetching blood units:', err);
        return res.status(500).json({ error: 'Database error while fetching blood units' });
      }
      res.json(bloodUnits);
    }
  );
};

//  Lấy đơn vị máu theo ID
exports.getBloodUnit = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT blood_unit_id, blood_group_id, component_type, status, collection_date, expiry_date
     FROM bloodunits
     WHERE blood_unit_id = ?`,
    [id],
    (err, bloodUnits) => {
      if (err) {
        console.error('Error fetching blood unit detail:', err);
        return res.status(500).json({ error: 'Database error while fetching blood unit' });
      }
      if (!bloodUnits.length) {
        return res.status(404).json({ message: 'Blood unit not found' });
      }
      res.json(bloodUnits[0]);
    }
  );
};

// Tạo mới đơn vị máu
exports.createBloodUnit = (req, res) => {
  const {
    blood_unit_id,
    blood_group_id,
    component_type,
    status,
    collection_date,
    expiry_date,
    event_id
  } = req.body;

  if (
    blood_unit_id === undefined ||
    !blood_group_id ||
    !component_type ||
    status === undefined ||
    !collection_date ||
    !expiry_date
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!VALID_COMPONENT_TYPES.includes(component_type)) {
    return res.status(400).json({
      error: `Invalid component_type. Must be one of: ${VALID_COMPONENT_TYPES.join(', ')}`
    });
  }

  const checkSql = 'SELECT blood_unit_id FROM bloodunits WHERE blood_unit_id = ?';
  db.query(checkSql, [blood_unit_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error checking blood unit ID:', checkErr);
      return res.status(500).json({ error: 'Database error while checking ID' });
    }

    if (checkResult.length > 0) {
      return res.status(409).json({ error: 'Blood unit ID already exists' });
    }

    const insertSql = `
      INSERT INTO bloodunits
      (blood_unit_id, blood_group_id, component_type, status, collection_date, expiry_date, event_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      insertSql,
      [blood_unit_id, blood_group_id, component_type, status, collection_date, expiry_date, event_id || null],
      (err, result) => {
        if (err) {
          console.error('Error inserting blood unit:', err);
          return res.status(500).json({ error: 'Database error while inserting blood unit' });
        }

        res.status(201).json({
          message: 'Blood unit created successfully',
          blood_unit_id: blood_unit_id
        });
      }
    );
  });
};


// Tìm theo blood group
exports.searchBloodUnitsByGroup = (req, res) => {
  const { blood_group_id } = req.query;

  if (!blood_group_id) {
    return res.status(400).json({ error: 'Missing blood_group_id in query' });
  }

  db.query(
    `SELECT blood_unit_id, blood_group_id, component_type, status, collection_date, expiry_date
     FROM bloodunits
     WHERE blood_group_id = ?
     ORDER BY collection_date DESC`,
    [blood_group_id],
    (err, results) => {
      if (err) {
        console.error('Error searching blood units by group:', err);
        return res.status(500).json({ error: 'Database error while searching blood units' });
      }

      res.json(results);
    }
  );
};

