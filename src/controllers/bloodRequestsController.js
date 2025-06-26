const db = require('../../config/db');

// Ràng buộc các giá trị hợp lệ cho status
const VALID_STATUSES = [0, 1, 2]; // 0: Pending, 1: Processing, 2: Done

const BLOOD_REQUEST_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  DONE: 2,
};

//
// =======================
// I. STAFF APIs
// =======================
//

// 1. Tìm kiếm member theo CCCD hoặc tên
exports.searchMembersForRequest = (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const sql = `
    SELECT 
      user_id, full_name, email, blood_group_id, weight, role
    FROM accounts 
    WHERE (user_id LIKE ? OR full_name LIKE ?) 
      AND role = 'member'
    ORDER BY full_name ASC
  `;

  const likeQuery = `%${query}%`;

  db.query(sql, [likeQuery, likeQuery], (err, results) => {
    if (err) {
      console.error('Error searching members:', err);
      return res.status(500).json({ error: 'Database error while searching members' });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        message: 'No members found with the provided search criteria',
        results: []
      });
    }

    res.json({
      message: `Found ${results.length} member(s)`,
      results: results
    });
  });
};

// 1b. Lấy chi tiết member theo CCCD
exports.getMemberByCCCD = (req, res) => {
  const { cccd } = req.params;

  if (!cccd) {
    return res.status(400).json({ error: 'CCCD is required' });
  }

  const sql = `
    SELECT 
      user_id, full_name, email, blood_group_id, weight, role
    FROM accounts 
    WHERE user_id = ? AND role = 'member'
  `;

  db.query(sql, [cccd], (err, results) => {
    if (err) {
      console.error('Error fetching member by CCCD:', err);
      return res.status(500).json({ error: 'Database error while fetching member' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Member not found or not a valid member' });
    }

    res.json({
      message: 'Member found successfully',
      member: results[0]
    });
  });
};

// 2. Tạo yêu cầu máu
exports.createRequest = (req, res) => {
  const {
    requester_id,
    blood_group_id,
    component_type,
    units_required,
    urgency_level,
    notes
  } = req.body;

  if (
    !requester_id ||
    !blood_group_id ||
    !component_type ||
    typeof units_required !== 'number' || units_required <= 0 ||
    typeof urgency_level !== 'number'
  ) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  const checkRequesterSql = `
    SELECT user_id, full_name, email, blood_group_id, weight, role
    FROM accounts 
    WHERE user_id = ?
  `;

  db.query(checkRequesterSql, [requester_id], (err, requesterResults) => {
    if (err) {
      console.error('Error checking requester:', err);
      return res.status(500).json({ error: 'Database error while checking requester' });
    }

    if (requesterResults.length === 0) {
      return res.status(404).json({ error: 'Requester not found' });
    }

    const requester = requesterResults[0];

    if (requester.role !== 'member') {
      return res.status(400).json({ error: 'Only members can request blood' });
    }

    const sql = `
      INSERT INTO bloodrequests 
      (requester_id, blood_group_id, component_type, units_required, urgency_level, request_date, status, notes)
      VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`;

    db.query(sql, [
      requester_id,
      blood_group_id,
      component_type,
      units_required,
      urgency_level,
      BLOOD_REQUEST_STATUS.PENDING,
      notes || ''
    ], (err, result) => {
      if (err) {
        console.error('Error creating blood request:', err);
        return res.status(500).json({ error: 'Database error while creating request' });
      }

      res.status(201).json({
        message: 'Blood request created successfully',
        request_id: result.insertId,
        requester_info: {
          user_id: requester.user_id,
          name: requester.full_name,
          email: requester.email,
          blood_group_id: requester.blood_group_id,
          weight: requester.weight
        }
      });
    });
  });
};

// 3. Xem tất cả yêu cầu
exports.getAllRequests = (req, res) => {
  db.query(`
    SELECT 
      br.request_id, br.requester_id, a.full_name AS requester_name, a.email AS requester_email,
      br.blood_group_id, br.component_type, br.units_required,
      br.urgency_level, br.request_date, br.status, br.notes
    FROM bloodrequests br
    JOIN accounts a ON br.requester_id = a.user_id
    ORDER BY br.request_date DESC
  `, (err, results) => {
    if (err) {
      console.error('Error fetching blood requests:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
};

// 4. Cập nhật yêu cầu
exports.updateRequest = (req, res) => {
  const { id } = req.params;
  const {
    blood_group_id,
    component_type,
    units_required,
    urgency_level,
    status,
    notes
  } = req.body;

  if (
    isNaN(id) ||
    blood_group_id === undefined || component_type === undefined ||
    typeof units_required !== 'number' || units_required <= 0 ||
    typeof urgency_level !== 'number' ||
    !VALID_STATUSES.includes(status)
  ) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  const sql = `
    UPDATE bloodrequests SET
      blood_group_id = ?, component_type = ?, units_required = ?,
      urgency_level = ?, status = ?, notes = ?
    WHERE request_id = ?`;

  db.query(sql, [
    blood_group_id, component_type, units_required,
    urgency_level, status, notes || '', id
  ], (err, result) => {
    if (err) {
      console.error('Error updating request:', err);
      return res.status(500).json({ error: 'Database error while updating request' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Blood request updated successfully' });
  });
};

// 5. Xoá yêu cầu
exports.deleteRequest = (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid request ID' });
  }

  db.query('DELETE FROM bloodrequests WHERE request_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting request:', err);
      return res.status(500).json({ error: 'Database error while deleting request' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Blood request deleted successfully' });
  });
};

//
// =======================
// II. MEMBER APIs
// =======================
//

// 1. Xem yêu cầu của chính mình
exports.getMyRequests = (req, res) => {
  const userId = req.user.id;

  db.query(`
    SELECT 
      br.request_id, br.blood_group_id, br.component_type, br.units_required,
      br.urgency_level, br.request_date, br.status, br.notes,
      a.full_name AS requester_name, a.email AS requester_email
    FROM bloodrequests br
    JOIN accounts a ON br.requester_id = a.user_id
    WHERE br.requester_id = ?
    ORDER BY br.request_date DESC
  `, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching member requests:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
};
