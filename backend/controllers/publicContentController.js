// ============================================================
// publicContentController.js — Public, read-only website content
// ============================================================
// These endpoints power the public marketing pages. They expose
// only ACTIVE / PUBLISHED rows. No authentication is required.
// ============================================================

const pool = require('../db');

// GET /api/content/solutions
async function getSolutions(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, summary, description, icon
       FROM solutions
       WHERE is_active = true
       ORDER BY sort_order ASC, id ASC`
    );
    return res.json({ solutions: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/content/case-studies
async function getCaseStudies(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, client, industry, summary, outcome, image_url, created_at
       FROM case_studies
       ORDER BY created_at DESC, id DESC`
    );
    return res.json({ caseStudies: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/content/feedback
async function getFeedback(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, customer_name, company, rating, comment, created_at
       FROM feedback
       WHERE is_published = true
       ORDER BY created_at DESC, id DESC`
    );
    // Average rating for a quick "social proof" headline figure
    const avg = result.rows.length
      ? result.rows.reduce((sum, r) => sum + r.rating, 0) / result.rows.length
      : 0;
    return res.json({
      feedback: result.rows,
      averageRating: Math.round(avg * 10) / 10,
      count: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/content/articles
async function getArticles(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, cover_image, author, published_at
       FROM articles
       WHERE is_published = true
       ORDER BY published_at DESC, id DESC`
    );
    return res.json({ articles: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/content/articles/:slug
async function getArticleBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT id, slug, title, excerpt, body, cover_image, author, published_at
       FROM articles
       WHERE slug = $1 AND is_published = true`,
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }
    return res.json({ article: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// GET /api/content/events
async function getEvents(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, title, description, location, event_date, is_upcoming, cover_image
       FROM events
       ORDER BY event_date DESC NULLS LAST, id DESC`
    );
    return res.json({
      upcoming: result.rows.filter(e => e.is_upcoming),
      past:     result.rows.filter(e => !e.is_upcoming),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/content/gallery
async function getGallery(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT g.id, g.image_url, g.caption, g.created_at, e.title AS event_title
       FROM gallery_images g
       LEFT JOIN events e ON e.id = g.event_id
       ORDER BY g.created_at DESC, g.id DESC`
    );
    return res.json({ gallery: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSolutions,
  getCaseStudies,
  getFeedback,
  getArticles,
  getArticleBySlug,
  getEvents,
  getGallery,
};
