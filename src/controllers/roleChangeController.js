const db = require('../../config/db');

// Người dùng gửi yêu cầu đổi quyền
exports.requestRoleChange = (req, res) => {
  const user_id = req.user.id;
  const { requested_role } = req.body;

  const allowedRoles = ['staff', 'manager'];
  if (!allowedRoles.includes(requested_role)) {
    return res.status(400).json({ error: 'Invalid role requested' });
  }

  const checkSql = `
    SELECT * FROM role_change_requests
    WHERE user_id = ? AND status = 'pending'
  `;
  db.query(checkSql, [user_id], (err, existing) => {
    if (err) {
      console.error('Check error:', err);
      return res.status(500).json({ error: 'Database error while checking request' });
    }

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You already have a pending role change request' });
    }

    const insertSql = `
      INSERT INTO role_change_requests (user_id, requested_role)
      VALUES (?, ?)
    `;
    db.query(insertSql, [user_id, requested_role], (err2, result) => {
      if (err2) {
        console.error('Insert error:', err2);
        return res.status(500).json({ error: 'Failed to create role change request' });
      }

      res.status(201).json({
        message: 'Role change request submitted for admin review',
        request_id: result.insertId,
        user_id,
        requested_role
      });
    });
  });
};
// Người dùng xem tình trạng yêu cầu đổi quyền
exports.getMyRoleChangeRequestStatus = (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT request_id, requested_role, status, created_at, updated_at
    FROM role_change_requests
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(sql, [user_id], (err, rows) => {
    if (err) {
      console.error('Error fetching role change status:', err);
      return res.status(500).json({ error: 'Failed to retrieve request status' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'You have no role change requests' });
    }

    res.status(200).json(rows[0]);
  });
};


// Admin xem danh sách yêu cầu
exports.getAllRoleChangeRequests = (req, res) => {
  const sql = `
    SELECT r.request_id, r.user_id, a.full_name, r.requested_role, r.status, r.created_at
    FROM role_change_requests r
    JOIN accounts a ON r.user_id = a.user_id
    ORDER BY r.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch role change requests' });
    }

    res.status(200).json(results);
  });
};

// Admin duyệt yêu cầu => cập nhật tài khoản + status = 'completed'
exports.approveRoleChange = (req, res) => {
  const requestId = req.params.id;

  const getSql = `SELECT * FROM role_change_requests WHERE request_id = ? AND status = 'pending'`;
  db.query(getSql, [requestId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Request not found or already processed' });

    const { user_id, requested_role } = results[0];

    const updateUserSql = `UPDATE accounts SET role = ?, updated_at = NOW() WHERE user_id = ?`;
    db.query(updateUserSql, [requested_role, user_id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Failed to update user role' });

      const updateRequestSql = `UPDATE role_change_requests SET status = 'completed' WHERE request_id = ?`;
      db.query(updateRequestSql, [requestId], (err3) => {
        if (err3) return res.status(500).json({ error: 'Failed to mark request as completed' });

        res.json({ message: 'Role change approved and user role updated' });
      });
    });
  });
};

// Admin từ chối yêu cầu
exports.rejectRoleChange = (req, res) => {
  const requestId = req.params.id;

  const updateSql = `
    UPDATE role_change_requests
    SET status = 'rejected'
    WHERE request_id = ? AND status = 'pending'
  `;
  db.query(updateSql, [requestId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    res.json({ message: 'Role change request rejected' });
  });
};
// Admin duyệt yêu cầu đổi quyền 
exports.approveRoleChangeByRequestId = (req, res) => {
  const request_id = req.params.id;

  const getSql = `
    SELECT user_id, requested_role 
    FROM role_change_requests 
    WHERE request_id = ? AND status = 'pending'
  `;

  db.query(getSql, [request_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error while finding request' });
    if (rows.length === 0) return res.status(404).json({ error: 'Request not found or already processed' });

    const { user_id, requested_role } = rows[0];
    const allowedRoles = ['staff', 'manager'];

    if (!allowedRoles.includes(requested_role)) {
      return res.status(400).json({ error: 'Invalid role in request' });
    }

    const updateUserSql = `
      UPDATE accounts SET role = ?, updated_at = NOW()
      WHERE user_id = ?
    `;
    db.query(updateUserSql, [requested_role, user_id], (err2, result) => {
      if (err2) return res.status(500).json({ error: 'Failed to update role' });

      const markCompletedSql = `
        UPDATE role_change_requests SET status = 'completed'
        WHERE request_id = ?
      `;
      db.query(markCompletedSql, [request_id], (err3) => {
        if (err3) return res.status(500).json({ error: 'Role updated but failed to mark request complete' });

        res.status(200).json({ message: `User ${user_id} role updated to ${requested_role} and request marked completed.` });
      });
    });
  });
};
