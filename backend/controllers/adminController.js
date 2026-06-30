// ============================================================
// adminController.js — Admin-only operations
// ============================================================
// The admin area has a single purpose: review the customer
// inquiries submitted through the public "Contact Us" form.
// (No user/role management — there is only the admin role.)
// ============================================================

const pool             = require('../db');
const { log }          = require('../utils/logger');

// ------------------------------------------------------------
// GET /api/admin/stats
// Dashboard headline figures + the distinct country list used to
// populate the table's country filter.
// ------------------------------------------------------------
async function getStats(req, res, next) {
  try {
    const [total, unread, last7, today, countries] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM inquiries'),
      pool.query('SELECT COUNT(*) FROM inquiries WHERE is_read = false'),
      pool.query("SELECT COUNT(*) FROM inquiries WHERE created_at >= NOW() - INTERVAL '7 days'"),
      pool.query('SELECT COUNT(*) FROM inquiries WHERE created_at::date = CURRENT_DATE'),
      pool.query("SELECT DISTINCT country FROM inquiries WHERE country IS NOT NULL AND country <> '' ORDER BY country ASC"),
    ]);
    return res.json({
      totalInquiries:  parseInt(total.rows[0].count, 10),
      unreadInquiries: parseInt(unread.rows[0].count, 10),
      last7Days:       parseInt(last7.rows[0].count, 10),
      today:           parseInt(today.rows[0].count, 10),
      countries:       countries.rows.map(r => r.country),
    });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// GET /api/admin/inquiries?page=&limit=&search=&country=&status=
// Paginated, searchable, filterable list for the dashboard table.
// ------------------------------------------------------------
async function getInquiries(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page, 10)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { search, country, status } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      const p = `$${params.length}`;
      conditions.push(
        `(full_name ILIKE ${p} OR email ILIKE ${p} OR company ILIKE ${p} OR job_title ILIKE ${p} OR job_details ILIKE ${p})`
      );
    }
    if (country) {
      params.push(country);
      conditions.push(`country = $${params.length}`);
    }
    if (status === 'read') conditions.push('is_read = true');
    if (status === 'unread') conditions.push('is_read = false');

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM inquiries ${whereClause}`, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT id, full_name, email, phone, company, country, job_title, job_details, is_read, created_at
       FROM inquiries
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.json({
      inquiries: dataResult.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// GET /api/admin/inquiries/:id — full detail of one inquiry
// Viewing an inquiry marks it as read.
// ------------------------------------------------------------
async function getInquiry(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM inquiries WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }
    // Mark as read on open (idempotent).
    await pool.query('UPDATE inquiries SET is_read = true WHERE id = $1 AND is_read = false', [id]);
    const inquiry = { ...result.rows[0], is_read: true };
    return res.json({ inquiry });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// PATCH /api/admin/inquiries/:id/read   body: { is_read }
// ------------------------------------------------------------
async function setInquiryRead(req, res, next) {
  try {
    const { id } = req.params;
    const isRead = req.body.is_read !== false; // default true
    const result = await pool.query(
      'UPDATE inquiries SET is_read = $1 WHERE id = $2 RETURNING id',
      [isRead, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }
    return res.json({ message: isRead ? 'Marked as read.' : 'Marked as unread.' });
  } catch (err) {
    next(err);
  }
}

// ------------------------------------------------------------
// DELETE /api/admin/inquiries/:id
// ------------------------------------------------------------
async function deleteInquiry(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM inquiries WHERE id = $1 RETURNING email', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }
    await log(req.user.id, 'ADMIN_DELETE_INQUIRY', 'success',
      `Admin "${req.user.username}" deleted inquiry from ${result.rows[0].email}`, req);
    return res.json({ message: 'Inquiry deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  getInquiries,
  getInquiry,
  setInquiryRead,
  deleteInquiry,
};
