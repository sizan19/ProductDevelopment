// ============================================================
// publicRoutes.js — Public website API (no authentication)
// ============================================================

const express = require('express');
const router  = express.Router();

const { submitInquiry } = require('../controllers/contactController');
const { chat }          = require('../controllers/chatController');
const {
  getSolutions,
  getCaseStudies,
  getFeedback,
  getArticles,
  getArticleBySlug,
  getEvents,
  getGallery,
} = require('../controllers/publicContentController');

const { handleValidationErrors, contactRules } = require('../middleware/validate');

// ---- Contact Us form -------------------------------------
// POST /api/contact — submit a customer inquiry (7 CSE fields, Turnstile-protected)
router.post('/contact', contactRules, handleValidationErrors, submitInquiry);

// ---- AI assistant chat proxy (Google Gemini) -------------
// POST /api/chat — forwards to Gemini server-side; key never leaves the backend
router.post('/chat', chat);

// ---- Public content (read-only) --------------------------
router.get('/content/solutions',       getSolutions);
router.get('/content/case-studies',    getCaseStudies);
router.get('/content/feedback',        getFeedback);
router.get('/content/articles',        getArticles);
router.get('/content/articles/:slug',  getArticleBySlug);
router.get('/content/events',          getEvents);
router.get('/content/gallery',         getGallery);

module.exports = router;
