const db = require('../../config/db');

// Helper: tìm article_id từ title
function getArticleIdByTitle(title, callback) {
  const sql = 'SELECT article_id FROM articles WHERE title LIKE ?';
  db.query(sql, [`%${title}%`], (err, results) => {
    if (err) return callback(err);

    if (results.length === 0) return callback(null, []); // trả về mảng rỗng nếu không có

    // Trả về danh sách article_id
    const articleIds = results.map(row => row.article_id);
    return callback(null, articleIds);
  });
}

// 1. Hiển thị danh sách blog yêu thích
exports.getFavoriteBlogsByUserId = (req, res) => {
  const user_id = req.user?.id || req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  const sql = `
    SELECT 
      bf.id AS favorite_id,
      a.article_id,
      a.title,
      a.content,
      a.category,
      a.author,
      a.image_url,
      a.created_at AS article_created_at,
      bf.created_at AS favorited_at
    FROM blog_favorites bf
    JOIN articles a ON bf.article_id = a.article_id
    WHERE bf.user_id = ?
    ORDER BY bf.created_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching favorites:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ favorites: results });
  });
};

// 2. Lưu blog yêu thích theo id
exports.addFavorite = (req, res) => {
  const user_id = req.user?.id || req.body.user_id;
  const { article_id } = req.body;

  if (!user_id || !article_id) {
    return res.status(400).json({ error: 'Missing user_id or article_id' });
  }

  // 1. Kiểm tra bài viết có tồn tại
  const checkArticleSql = 'SELECT 1 FROM articles WHERE article_id = ?';
  db.query(checkArticleSql, [article_id], (err, articleResults) => {
    if (err) return res.status(500).json({ error: 'Error checking article' });
    if (articleResults.length === 0) return res.status(404).json({ error: 'Article not found' });

    // 2. Kiểm tra đã yêu thích chưa
    const checkFavoriteSql = 'SELECT 1 FROM blog_favorites WHERE user_id = ? AND article_id = ?';
    db.query(checkFavoriteSql, [user_id, article_id], (err, favResults) => {
      if (err) return res.status(500).json({ error: 'Error checking favorite' });
      if (favResults.length > 0) return res.status(409).json({ error: 'Already favorited' });

      // 3. Thêm vào bảng blog_favorites
      const insertSql = 'INSERT INTO blog_favorites (user_id, article_id, created_at) VALUES (?, ?, NOW())';
      db.query(insertSql, [user_id, article_id], (err) => {
        if (err) return res.status(500).json({ error: 'Error inserting favorite' });
        res.status(201).json({ message: 'Blog favorited successfully' });
      });
    });
  });
};

// 3. Tìm blog yêu thích theo title
exports.getFavoriteByTitle = (req, res) => {
  const user_id = req.user?.id || req.query.user_id;
  const { title } = req.query;

  if (!user_id || !title) {
    return res.status(400).json({ error: 'Missing user_id or title' });
  }

  getArticleIdByTitle(title, (err, articleIds) => {
    if (err) return res.status(500).json({ error: 'Error finding article' });
    if (!articleIds || articleIds.length === 0) return res.status(404).json({ error: 'Article not found' });

    const placeholders = articleIds.map(() => '?').join(',');
    const sql = `
      SELECT 
        f.id AS favorite_id,
        f.article_id,
        f.created_at AS favorited_at,
        a.title,
        a.category,
        a.content,
        a.author,
        a.image_url,
        a.created_at AS article_created_at
      FROM blog_favorites f
      JOIN articles a ON f.article_id = a.article_id
      WHERE f.user_id = ? AND f.article_id IN (${placeholders})
      ORDER BY f.created_at DESC
    `;

    db.query(sql, [user_id, ...articleIds], (err, results) => {
      if (err) {
        console.error('SQL error:', err);
        return res.status(500).json({ error: 'Internal error' });
      }

      if (results.length === 0) return res.status(404).json({ error: 'Favorite not found' });

      res.json({ favorites: results });
    });
  });
};


// 4. Xoá blog yêu thích theo id (hoặc bạn có thể dùng title nếu muốn)
exports.deleteFavoriteById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing favorite id' });
  }

  const sql = 'DELETE FROM blog_favorites WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting favorite:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Favorite deleted successfully' });
  });
};
