const db = require('../../config/db');

exports.createComment = (req, res) => {
  const { article_id, content } = req.body;
  const user_id = req.user.id;

  if (!article_id || !content || !user_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Lấy user_name từ bảng accounts
  const getUserSql = `SELECT full_name FROM accounts WHERE user_id = ?`;
  db.query(getUserSql, [user_id], (err, userResult) => {
    if (err) {
      console.error('Error fetching user name:', err);
      return res.status(500).json({ error: 'Database error when fetching user name' });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_name = userResult[0].full_name;
    console.log(user_name);
    // 2. Chèn bình luận
    const sql = `
      INSERT INTO comments (article_id, user_id, user_name, content)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [article_id, user_id, user_name, content], (err, result) => {
      if (err) {
        console.error('Error inserting comment:', err);
        return res.status(500).json({ error: 'Database error when inserting comment' });
      }
      console.log("Query: ", sql);
console.log("Values: ", [article_id, user_id, user_name, content]);


      const newComment = {
        id: result.insertId,
        article_id,
        user_id,
        user_name,
        content,
        created_at: new Date()
      };

      res.status(201).json(newComment);
    });
  });
};
exports.getCommentsByArticleId = (req, res) => {
  const articleId = req.params.articleId;

  const sql = `
    SELECT comment_id, article_id, user_id, user_name, content, created_at
    FROM comments
    WHERE article_id = ?
    ORDER BY created_at ASC
  `;

  db.query(sql, [articleId], (err, results) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json(results);
  });
};
exports.updateComment = (req, res) => {
  const comment_id = req.params.commentId;
  const { content } = req.body;
  const user_id = req.user.id;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const checkSql = `SELECT * FROM comments WHERE comment_id = ? AND user_id = ?`;
  db.query(checkSql, [comment_id, user_id], (err, results) => {
    if (err) {
      console.error('Error checking comment:', err);
      return res.status(500).json({ error: 'Database error when checking comment' });
    }

    if (results.length === 0) {
      return res.status(403).json({ error: 'You can only update your own comment' });
    }

    const updateSql = `UPDATE comments SET content = ?, updated_at = NOW() WHERE comment_id = ?`;
    db.query(updateSql, [content, comment_id], (err, result) => {
      if (err) {
        console.error('Error updating comment:', err);
        return res.status(500).json({ error: 'Database error when updating comment' });
      }

      res.status(200).json({ message: 'Comment updated successfully' });
    });
  });
};

exports.deleteComment = (req, res) => {
  const comment_id = req.params.commentId;
  const user_id = req.user.id;

  const checkSql = `SELECT * FROM comments WHERE comment_id = ? AND user_id = ?`;
  db.query(checkSql, [comment_id, user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) {
      return res.status(403).json({ error: 'You can only delete your own comment' });
    }

    const deleteSql = `DELETE FROM comments WHERE comment_id = ?`;
    db.query(deleteSql, [comment_id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete comment' });
      res.status(200).json({ message: 'Comment deleted successfully' });
    });
  });
};

