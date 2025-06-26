

  const db = require('../../config/db');

exports.register = (req, res) => {
  const donor_id = req.user.id;
  const { event_id } = req.body;

  if (!event_id) return res.status(400).json({ error: 'Missing event_id' });

  // 1. Lấy thông tin sự kiện
  db.query(
    `SELECT donation_date, registration_deadline FROM donationevents WHERE event_id = ?`,
    [event_id],
    (err, events) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!events.length) return res.status(404).json({ message: 'Event not found' });

      const evDate = new Date(events[0].donation_date);
      const deadline = events[0].registration_deadline ? new Date(events[0].registration_deadline) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Bỏ giờ để so sánh chính xác ngày

      // ❌ Nếu quá hạn đăng ký
      if (deadline && today > deadline) {
        return res.status(400).json({
          message: `Đã quá hạn đăng ký (hạn chót: ${deadline.toISOString().split('T')[0]})`,
        });
      }

      // 2. Kiểm tra ngày hiến máu gần nhất
      db.query(`SELECT last_donation_date FROM accounts WHERE user_id = ?`, [donor_id], (err, accs) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!accs.length) return res.status(404).json({ message: 'Account not found' });

        const lastDonation = accs[0].last_donation_date;
        if (lastDonation) {
          const nextAllowed = new Date(lastDonation);
          nextAllowed.setMonth(nextAllowed.getMonth() + 3);
          if (evDate < nextAllowed) {
            return res.status(400).json({
              message: `Cần ≥3 tháng kể từ lần hiến máu trước (${lastDonation})`,
            });
          }
        }

        // 3. Kiểm tra đã đăng ký chưa
        db.query(
          `SELECT * FROM event_registrations WHERE event_id = ? AND donor_id = ?`,
          [event_id, donor_id],
          (err, regs) => {
            if (err) return res.status(500).json({ error: 'DB error' });

            if (!regs.length) {
              // ✅ Chưa đăng ký → INSERT
              db.query(
                `INSERT INTO event_registrations (event_id, donor_id, registration_status, checkin_status, created_at)
                 VALUES (?, ?, 1, 0, NOW())`,
                [event_id, donor_id],
                (err) => {
                  if (err) return res.status(500).json({ error: 'DB error' });
                  res.json({ message: 'Đăng ký thành công' });
                }
              );
            } else {
              const reg = regs[0];

              if (reg.registration_status === 1) {
                // ✅ Đã đăng ký → Hủy
                db.query(
                  `UPDATE event_registrations SET registration_status = 2 WHERE registration_event_id = ?`,
                  [reg.registration_event_id],
                  (err) => {
                    if (err) return res.status(500).json({ error: 'DB error' });
                    res.json({ message: 'Hủy đăng ký thành công' });
                  }
                );
              } else {
                // ✅ Đã hủy → Cho đăng ký lại
                db.query(
                  `UPDATE event_registrations SET registration_status = 1, created_at = NOW() WHERE registration_event_id = ?`,
                  [reg.registration_event_id],
                  (err) => {
                    if (err) return res.status(500).json({ error: 'DB error' });
                    res.json({ message: 'Đăng ký lại thành công' });
                  }
                );
              }
            }
          }
        );
      });
    }
  );
};



// 2.  xem danh sách đăng ký theo event
exports.listByEvent = (req, res) => {
  const { event_id } = req.params;

  db.query(
    `SELECT r.registration_event_id, r.donor_id, a.full_name,
            r.registration_status, r.checkin_status, r.units_collected, r.created_at
     FROM event_registrations r
     JOIN accounts a ON a.user_id = r.donor_id
     WHERE r.event_id = ?
     ORDER BY r.created_at DESC`,
    [event_id],
    (err, rows) => {
      if (err) {
        console.error(' Lỗi khi lấy danh sách đăng ký:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      res.json(rows);
    }
  );
};

// 3. cập nhật đăng ký
exports.updateRegistration = (req, res) => {
  const { registration_event_id } = req.params;
  const { checkin_status, units_collected, registration_status } = req.body;

  const selectSQL = `
    SELECT checkin_status, units_collected, registration_status
    FROM event_registrations
    WHERE registration_event_id = ?
  `;

  db.query(selectSQL, [registration_event_id], (err, results) => {
    if (err) {
      console.error('Lỗi khi truy vấn bản ghi cũ:', err);
      return res.status(500).json({ error: 'DB error' });
    }

    if (!results.length) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
    }

    const old = results[0];
    const unchangedFields = {};
    const changedFields = {};

    // Checkin status
    if (old.checkin_status === checkin_status) {
      unchangedFields.checkin_status = old.checkin_status ? 'Đã checkin' : 'Chưa checkin';
    } else {
      changedFields.checkin_status = checkin_status ? 'Đã checkin' : 'Chưa checkin';
    }

    // Registration status
    if (old.registration_status === registration_status) {
      unchangedFields.registration_status =
        old.registration_status === 0
          ? 'Chưa đăng ký'
          : old.registration_status === 1
          ? 'Đã đăng ký'
          : 'Hủy đăng ký';
    } else {
      changedFields.registration_status =
        registration_status === 0
          ? 'Chưa đăng ký'
          : registration_status === 1
          ? 'Đã đăng ký'
          : 'Hủy đăng ký';
    }

    // Units collected – chỉ được cập nhật nếu checkin_status hiện tại hoặc mới là 1
    const finalCheckinStatus = typeof checkin_status === 'number' ? checkin_status : old.checkin_status;
    if (old.units_collected === units_collected) {
      unchangedFields.units_collected = old.units_collected + 'ml';
    } else {
      if (finalCheckinStatus !== 1) {
        return res.status(400).json({
          message: 'Chỉ được cập nhật lượng máu khi đã checkin',
        });
      }
      changedFields.units_collected = units_collected + 'ml';
    }

    // Nếu không có gì thay đổi
    if (Object.keys(changedFields).length === 0) {
      return res.status(400).json({
        message: 'Thông tin không thay đổi, không cập nhật',
      });
    }

    // Tiến hành cập nhật
    const updateSQL = `
      UPDATE event_registrations
      SET checkin_status = ?, units_collected = ?, registration_status = ?
      WHERE registration_event_id = ?
    `;

    db.query(
      updateSQL,
      [checkin_status, units_collected, registration_status, registration_event_id],
      (err) => {
        if (err) {
          console.error('Lỗi khi cập nhật đăng ký:', err);
          return res.status(500).json({ error: 'DB error' });
        }

        res.json({
          message: 'Cập nhật thành công',
          changed_fields: changedFields,
        });
      }
    );
  });
};

// 4. Member xem các sự kiện mình đã đăng ký
exports.listMyRegistrations = (req, res) => {
  const donor_id = req.user.id;

  const sql = `
  SELECT 
    er.registration_event_id,
    er.event_id,
    e.event_name,
    e.donation_date,
    -- e.notes AS event_notes, ⬅ LOẠI BỎ hoặc đổi thành cột có tồn tại
    er.registration_status,
    er.checkin_status,
    er.units_collected
  FROM event_registrations er
  JOIN donationevents e ON er.event_id = e.event_id
  WHERE er.donor_id = ?
  ORDER BY e.donation_date DESC
`;


  db.query(sql, [donor_id], (err, rows) => {
    if (err) {
      console.error(' Lỗi khi lấy đăng ký cá nhân:', err);
      return res.status(500).json({ error: 'DB error' });
    }

    res.json(rows);
  });
};
