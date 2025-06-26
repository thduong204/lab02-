const db = require('../../config/db');

// 1. Lấy tất cả sự kiện
exports.listEvents = (req, res) => {
  db.query(
    `SELECT event_id, event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, created_at
     FROM donationevents
     ORDER BY donation_date DESC`,
    (err, events) => {
      if (err) {
        console.error('Error fetching events:', err);
        return res.status(500).json({ error: 'Database error while fetching events' });
      }
      res.json(events);
    }
  );
};

// 2. Lấy chi tiết 1 sự kiện
exports.getEvent = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT event_id, event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, created_at
     FROM donationevents
     WHERE event_id = ?`,
    [id],
    (err, events) => {
      if (err) {
        console.error('Error fetching event detail:', err);
        return res.status(500).json({ error: 'Database error while fetching event' });
      }
      if (!events.length) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(events[0]);
    }
  );
};

// 3. Tạo sự kiện (staff/admin)
exports.createEvent = (req, res) => {
  let { event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, blood_group_id } = req.body;

  if (!event_name || !donation_date || !registration_deadline || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now = new Date();
  const deadlineDate = new Date(registration_deadline);
  const donationDate = new Date(donation_date);

  if (deadlineDate < now) {
    return res.status(400).json({ error: 'Registration deadline cannot be in the past' });
  }

  if (donationDate <= deadlineDate) {
    return res.status(400).json({ error: 'Donation date must be after registration deadline' });
  }

  is_urgent = parseInt(is_urgent ?? 0);
  if (![0, 1].includes(is_urgent)) {
    return res.status(400).json({ error: 'is_urgent must be 0 or 1 only' });
  }

  // Nếu là khẩn cấp
  if (is_urgent === 1) {
    max_donor_count = parseInt(max_donor_count);
    if (isNaN(max_donor_count) || max_donor_count <= 0) {
      return res.status(400).json({ error: 'max_donor_count is required and must be > 0 for urgent events' });
    }

    blood_group_id = parseInt(blood_group_id);
    if (isNaN(blood_group_id)) {
      return res.status(400).json({ error: 'blood_group_id is required for urgent events' });
    }

    // Kiểm tra blood_group_id có tồn tại không
    db.query('SELECT * FROM bloodgroups WHERE blood_group_id = ?', [blood_group_id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error while checking blood group' });
      if (!result.length) return res.status(400).json({ error: 'Invalid blood_group_id' });

      // Chèn sự kiện sau khi kiểm tra
      insertEvent();
    });
  } else {
    max_donor_count = max_donor_count ? parseInt(max_donor_count) : null;
    blood_group_id = null;
    insertEvent();
  }

  function insertEvent() {
    db.query(
      `INSERT INTO donationevents (event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, created_at, blood_group_id)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, blood_group_id],
      (err, result) => {
        if (err) {
          console.error('Error inserting event:', err);
          return res.status(500).json({ error: 'Database error while inserting event' });
        }

        res.status(201).json({
          message: 'Event created successfully',
          event_id: result.insertId
        });
      }
    );
  }
};



// 4. Tìm kiếm sự kiện theo tên (theo từng từ)
exports.searchEventsByName = (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Missing event name for search' });
  }

  const keywords = name.trim().split(/\s+/).filter(Boolean);

  if (keywords.length === 0) {
    return res.status(400).json({ error: 'Invalid search keyword' });
  }

  const conditions = keywords.map(() => 'event_name LIKE ?').join(' AND ');
  const values = keywords.map(word => `%${word}%`);

  const sql = `
    SELECT event_id, event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, created_at
    FROM donationevents
    WHERE event_name IS NOT NULL AND ${conditions}
    ORDER BY donation_date DESC
  `;

  db.query(sql, values, (err, events) => {
    if (err) {
      console.error('Error searching events:', err);
      return res.status(500).json({ error: 'Database error while searching events' });
    }

    if (events.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(events);
  });
};

// 5. Cập nhật sự kiện (staff/admin)
exports.updateEvent = (req, res) => {
  const { id } = req.params;
  let { event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, blood_group_id } = req.body;

  if (!event_name || !donation_date || !registration_deadline || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now = new Date();
  const deadlineDate = new Date(registration_deadline);
  const donationDate = new Date(donation_date);

  if (deadlineDate < now) {
    return res.status(400).json({ error: 'Registration deadline cannot be in the past' });
  }

  if (donationDate <= deadlineDate) {
    return res.status(400).json({ error: 'Donation date must be after registration deadline' });
  }

  is_urgent = parseInt(is_urgent ?? 0);
  if (![0, 1].includes(is_urgent)) {
    return res.status(400).json({ error: 'is_urgent must be 0 or 1 only' });
  }

  if (is_urgent === 1) {
    max_donor_count = parseInt(max_donor_count);
    if (isNaN(max_donor_count) || max_donor_count <= 0) {
      return res.status(400).json({ error: 'max_donor_count is required and must be > 0 for urgent events' });
    }

    blood_group_id = parseInt(blood_group_id);
    if (isNaN(blood_group_id)) {
      return res.status(400).json({ error: 'blood_group_id is required for urgent events' });
    }

    // Kiểm tra blood_group_id có tồn tại
    db.query('SELECT * FROM bloodgroups WHERE blood_group_id = ?', [blood_group_id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error while checking blood group' });
      if (!result.length) return res.status(400).json({ error: 'Invalid blood_group_id' });

      updateEvent();
    });
  } else {
    max_donor_count = max_donor_count ? parseInt(max_donor_count) : null;
    blood_group_id = null;
    updateEvent();
  }

  function updateEvent() {
    db.query(
      `UPDATE donationevents
       SET event_name = ?, donation_date = ?, registration_deadline = ?, content = ?, is_urgent = ?, max_donor_count = ?, blood_group_id = ?
       WHERE event_id = ?`,
      [event_name, donation_date, registration_deadline, content, is_urgent, max_donor_count, blood_group_id, id],
      (err, result) => {
        if (err) {
          console.error('Error updating event:', err);
          return res.status(500).json({ error: 'Database error while updating event' });
        }
        if (!result.affectedRows) {
          return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event updated successfully' });
      }
    );
  }
};


// 6. Xóa sự kiện (staff/admin)
exports.deleteEvent = (req, res) => {
  const { id } = req.params;

  db.query(
    `DELETE FROM donationevents WHERE event_id = ?`,
    [id],
    (err, result) => {
      if (err) {
        console.error('Error deleting event:', err);
        return res.status(500).json({ error: 'Database error while deleting event' });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json({ message: 'Event deleted successfully' });
    }
  );
};
