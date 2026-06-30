// ============================================================
// adminRoutes.js — Admin-only API routes
// Every route requires: logged in (JWT + active session) + admin.
// Sole purpose: review Contact Us inquiries.
// ============================================================

const express = require('express');
const router  = express.Router();
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const {
  getStats,
  getInquiries,
  getInquiry,
  setInquiryRead,
  deleteInquiry,
} = require('../controllers/adminController');

// Apply auth + admin guard to every route in this file.
router.use(authenticate, requireAdmin);

router.get('/stats',                 getStats);
router.get('/inquiries',             getInquiries);
router.get('/inquiries/:id',         getInquiry);
router.patch('/inquiries/:id/read',  setInquiryRead);
router.delete('/inquiries/:id',      deleteInquiry);

module.exports = router;
