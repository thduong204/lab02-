const db = require('../../config/db');
const path = require('path');

// Get all articles
exports.getArticles = (req, res) => {
  db.query('SELECT * FROM articles ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
};

// Get one article by ID
exports.getArticleById = (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM articles WHERE article_id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Article not found' });
    res.json(results[0]);
  });
};

exports.searchArticlesByTitle = (req, res) => {
  const title = req.query.title?.trim();
  if (!title) {
    return res.status(400).json({ error: 'Missing title query parameter' });
  }

  const sql = `
    SELECT * FROM articles
    WHERE title LIKE ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [`%${title}%`], (err, results) => {
    if (err) {
      console.error('Error searching articles by title:', err);
      return res.status(500).json({ error: 'Database error while searching articles' });
    }

    res.json(results);
  });
};

// Create new article
exports.createArticle = (req, res) => {
  const { title, content, category, author } = req.body;

  // Nếu có file ảnh upload thì lấy đường dẫn, ngược lại null
  let image_url = null;
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
  }

  const sql = `
    INSERT INTO articles (title, content, category, author, image_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `;

  db.query(sql, [title, content, category, author, image_url], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json({ message: 'Article created successfully', article_id: result.insertId });
  });
};

// Update article
exports.updateArticle = (req, res) => {
  const { id } = req.params;

  // L?y bi vi?t hi?n t?i
  db.query('SELECT * FROM articles WHERE article_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'Article not found' });

    const article = results[0];

    const { title, content, category, author } = this.extractArticleData(req, article);

    // X? l ?nh m?i n?u c
    const image_url = this.processImage(req, article);

    const sql = `
      UPDATE articles 
      SET title = ?, content = ?, category = ?, author = ?, image_url = ?, updated_at = NOW()
      WHERE article_id = ?
    `;

    db.query(sql, [title, content, category, author, image_url, id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Article updated successfully' });
    });
  });
};

exports.extractArticleData = (req, article) => {
  // N?u c d? li?u m?i th l?y, n?u khng gi? nguyn
  const title = req.body.title || article.title;
  const content = req.body.content || article.content;
  const category = req.body.category || article.category;
  const author = req.body.author || article.author;
  return { title, content, category, author };
};

exports.processImage = (req, article) => {
  let image_url = article.image_url;
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
    // TODO: Xa file ?nh cu n?u c?n
  }
  return image_url;
};


// Delete article
exports.deleteArticle = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM articles WHERE article_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Article deleted successfully' });
  });
};
