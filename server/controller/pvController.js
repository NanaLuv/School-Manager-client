const pool = require("../db");
const { getSchoolSettingsForPDF } = require("./control");

// GET /api/pv-headers - Get all PV headers with item counts
const getPVHeaders = async (req, res) => {
  try {
    const {
      status,
      start_date,
      end_date,
      paid_to,
      page = 1,
      limit = 20,
    } = req.query;

    let whereConditions = ["1=1"];
    let queryParams = [];
    const offset = (page - 1) * limit;

    if (status) {
      whereConditions.push("pv.status = ?");
      queryParams.push(status);
    }

    if (start_date && end_date) {
      whereConditions.push("pv.pv_date BETWEEN ? AND ?");
      queryParams.push(start_date, end_date);
    }

    if (paid_to) {
      whereConditions.push("pv.paid_to LIKE ?");
      queryParams.push(`%${paid_to}%`);
    }

    const [headers] = await pool.query(
      `SELECT 
         pv.*,
         COUNT(pi.id) as item_count,
         u.username as recorded_by_name,
         au.username as approved_by_name
       FROM pv_headers pv
       LEFT JOIN pv_items pi ON pv.id = pi.pv_header_id
       LEFT JOIN users u ON pv.recorded_by = u.id
       LEFT JOIN users au ON pv.approved_by = au.id
       WHERE ${whereConditions.join(" AND ")}
       GROUP BY pv.id
       ORDER BY pv.pv_date DESC, pv.id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset],
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM pv_headers pv
       WHERE ${whereConditions.join(" AND ")}`,
      queryParams,
    );

    res.json({
      pv_headers: headers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching PV headers:", error);
    res.status(500).json({ error: "Failed to fetch PV headers" });
  }
};

// GET /api/pv-headers/:id - Get single PV header with its items
const getPVHeaderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [headers] = await pool.query(
      `SELECT pv.*, u.username as recorded_by_name, au.username as approved_by_name
       FROM pv_headers pv
       LEFT JOIN users u ON pv.recorded_by = u.id
       LEFT JOIN users au ON pv.approved_by = au.id
       WHERE pv.id = ?`,
      [id],
    );

    if (headers.length === 0) {
      return res.status(404).json({ error: "PV not found" });
    }

    const [items] = await pool.query(
      `SELECT * FROM pv_items WHERE pv_header_id = ? ORDER BY id`,
      [id],
    );

    res.json({
      ...headers[0],
      items: items,
    });
  } catch (error) {
    console.error("Error fetching PV:", error);
    res.status(500).json({ error: "Failed to fetch PV" });
  }
};

// POST /api/pv-headers - Create new PV header with items
const createPVHeader = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      pv_date,
      description,
      paid_to,
      payment_method,
      reference_number,
      items,
      recorded_by,
    } = req.body;

    // Generate PV number
    const [lastPV] = await connection.query(
      `SELECT pv_number FROM pv_headers ORDER BY id DESC LIMIT 1`,
    );

    let pvNumber = "PV-001";
    if (lastPV.length > 0) {
      const lastNum = parseInt(lastPV[0].pv_number.split("-")[1]);
      pvNumber = `PV-${String(lastNum + 1).padStart(3, "0")}`;
    }

    // Calculate total amount from items
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += parseFloat(item.quantity) * parseFloat(item.unit_price);
    }

    // Insert PV header
    const [headerResult] = await connection.query(
      `INSERT INTO pv_headers 
       (pv_number, pv_date, description, total_amount, status, paid_to, payment_method, reference_number, recorded_by) 
       VALUES (?, ?, ?, ?, 'Draft', ?, ?, ?, ?)`,
      [
        pvNumber,
        pv_date,
        description,
        totalAmount,
        paid_to,
        payment_method,
        reference_number,
        recorded_by,
      ],
    );

    const pvHeaderId = headerResult.insertId;

    // Insert items
    for (const item of items) {
      await connection.query(
        `INSERT INTO pv_items 
         (pv_header_id, expense_category, quantity, unit_price, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          pvHeaderId,
          item.expense_category,
          item.quantity,
          item.unit_price,
          item.description,
        ],
      );
    }

    await connection.commit();

    // Return the created PV with items
    const [newPV] = await connection.query(
      `SELECT pv.*, u.username as recorded_by_name
       FROM pv_headers pv
       LEFT JOIN users u ON pv.recorded_by = u.id
       WHERE pv.id = ?`,
      [pvHeaderId],
    );

    const [newItems] = await connection.query(
      `SELECT * FROM pv_items WHERE pv_header_id = ?`,
      [pvHeaderId],
    );

    res.status(201).json({
      ...newPV[0],
      items: newItems,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating PV:", error);
    res.status(500).json({ error: "Failed to create PV" });
  } finally {
    connection.release();
  }
};

// PUT /api/pv-headers/:id - Update PV (only if status is Draft)
const updatePVHeader = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      pv_date,
      description,
      paid_to,
      payment_method,
      reference_number,
      items,
    } = req.body;

    // Check if PV exists and is still Draft
    const [existing] = await connection.query(
      "SELECT status FROM pv_headers WHERE id = ? FOR UPDATE",
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "PV not found" });
    }

    if (existing[0].status !== "Draft") {
      await connection.rollback();
      return res.status(400).json({
        error: "Cannot update PV that is already approved or paid",
      });
    }

    // Calculate total amount from items
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += parseFloat(item.quantity) * parseFloat(item.unit_price);
    }

    // Update PV header
    await connection.query(
      `UPDATE pv_headers SET 
         pv_date = ?, description = ?, total_amount = ?, 
         paid_to = ?, payment_method = ?, reference_number = ?
       WHERE id = ?`,
      [
        pv_date,
        description,
        totalAmount,
        paid_to,
        payment_method,
        reference_number,
        id,
      ],
    );

    // Delete existing items
    await connection.query("DELETE FROM pv_items WHERE pv_header_id = ?", [id]);

    // Insert new items
    for (const item of items) {
      await connection.query(
        `INSERT INTO pv_items 
         (pv_header_id, expense_category, quantity, unit_price, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          item.expense_category,
          item.quantity,
          item.unit_price,
          item.description,
        ],
      );
    }

    await connection.commit();

    // Return updated PV
    const [updated] = await connection.query(
      `SELECT pv.*, u.username as recorded_by_name
       FROM pv_headers pv
       LEFT JOIN users u ON pv.recorded_by = u.id
       WHERE pv.id = ?`,
      [id],
    );

    const [updatedItems] = await connection.query(
      `SELECT * FROM pv_items WHERE pv_header_id = ?`,
      [id],
    );

    res.json({
      ...updated[0],
      items: updatedItems,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating PV:", error);
    res.status(500).json({ error: "Failed to update PV" });
  } finally {
    connection.release();
  }
};

// PUT /api/pv-headers/:id/approve - Approve a PV
const approvePV = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;

    const [existing] = await pool.query(
      "SELECT status FROM pv_headers WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "PV not found" });
    }

    if (existing[0].status !== "Draft") {
      return res.status(400).json({
        error: `Cannot approve PV with status '${existing[0].status}'`,
      });
    }

    await pool.query(
      `UPDATE pv_headers SET 
         status = 'Approved', 
         approved_by = ?, 
         approved_at = NOW()
       WHERE id = ?`,
      [approved_by, id],
    );

    res.json({
      success: true,
      message: "PV approved successfully",
    });
  } catch (error) {
    console.error("Error approving PV:", error);
    res.status(500).json({ error: "Failed to approve PV" });
  }
};

// PUT /api/pv-headers/:id/mark-paid - Mark PV as paid
const markPVAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      "SELECT status FROM pv_headers WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "PV not found" });
    }

    if (existing[0].status !== "Approved") {
      return res.status(400).json({
        error: "Only approved PVs can be marked as paid",
      });
    }

    await pool.query(`UPDATE pv_headers SET status = 'Paid' WHERE id = ?`, [
      id,
    ]);

    res.json({
      success: true,
      message: "PV marked as paid",
    });
  } catch (error) {
    console.error("Error marking PV as paid:", error);
    res.status(500).json({ error: "Failed to mark PV as paid" });
  }
};

// DELETE /api/pv-headers/:id - Delete PV (only if Draft)
const deletePVHeader = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [existing] = await connection.query(
      "SELECT status FROM pv_headers WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "PV not found" });
    }

    if (existing[0].status !== "Draft") {
      await connection.rollback();
      return res.status(400).json({
        error: "Only draft PVs can be deleted",
      });
    }

    // Delete items first (cascade should handle this, but let's be explicit)
    await connection.query("DELETE FROM pv_items WHERE pv_header_id = ?", [id]);
    await connection.query("DELETE FROM pv_headers WHERE id = ?", [id]);

    await connection.commit();

    res.json({
      success: true,
      message: "PV deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting PV:", error);
    res.status(500).json({ error: "Failed to delete PV" });
  } finally {
    connection.release();
  }
};

// GET /api/pv-headers/statistics - Get PV statistics
const getPVStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereConditions = ["1=1"];
    let queryParams = [];

    if (start_date && end_date) {
      whereConditions.push("pv_date BETWEEN ? AND ?");
      queryParams.push(start_date, end_date);
    }

    const [stats] = await pool.query(
      `SELECT 
         COUNT(*) as total_pvs,
         SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) as draft_count,
         SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
         SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_count,
         SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected_count,
         SUM(total_amount) as total_amount,
         AVG(total_amount) as average_amount
       FROM pv_headers
       WHERE ${whereConditions.join(" AND ")}`,
      queryParams,
    );

    res.json(stats[0] || {});
  } catch (error) {
    console.error("Error fetching PV statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};



module.exports = {
  getPVHeaders,
  getPVHeaderById,
  createPVHeader,
  updatePVHeader,
  approvePV,
  markPVAsPaid,
  deletePVHeader,
  getPVStatistics,
};


