// payrollController.js
const pool = require("../db");
const { jsPDF } = require("jspdf");
const { autoTable } = require("jspdf-autotable");


// Calculate Ghana tax - 
const calculateGHATax = (annualIncome) => {
  // Convert annual income to monthly for calculation
  const monthlyIncome = annualIncome / 12;

  // Calculate SSNIT employee contribution (5.5%)
  const ssnitEmployeeContribution = calculateSSNIT(monthlyIncome);

  // Taxable income = monthly income minus SSNIT contribution
  // First GHS 490 per month is tax-free (GHS 5,880 annually)
  const taxableIncomeAfterSSNIT = monthlyIncome - ssnitEmployeeContribution;

  if (taxableIncomeAfterSSNIT <= 490) {
    return 0;
  }

  // Ghana income tax brackets (MONTHLY amounts) after SSNIT deduction
  const taxBrackets = [
    { limit: 490, rate: 0.0 }, // 0% for first GHS 490
    { limit: 600, rate: 0.05 }, // 5% for next GHS 110 (490 to 600)
    { limit: 730, rate: 0.1 }, // 10% for next GHS 130 (600 to 730)
    { limit: 3896.67, rate: 0.175 }, // 17.5% for next GHS 3,166.67 (730 to 3,896.67)
    { limit: 20229.67, rate: 0.25 }, // 25% for next GHS 16,333 (3,896.67 to 20,229.67)
    { limit: 40766.67, rate: 0.3 }, // 30% for next GHS 20,537 (20,229.67 to 40,766.67)
    { limit: Infinity, rate: 0.35 }, // 35% for exceeding GHS 40,766.67
  ];

  let taxableAmount = taxableIncomeAfterSSNIT;
  let tax = 0;

  for (let i = 0; i < taxBrackets.length; i++) {
    const prevLimit = i === 0 ? 0 : taxBrackets[i - 1].limit;
    const currentLimit = taxBrackets[i].limit;

    // If there's taxable income in this bracket
    if (taxableAmount > prevLimit) {
      const taxableInThisBracket =
        Math.min(currentLimit, taxableAmount) - prevLimit;

      if (taxableInThisBracket > 0) {
        tax += taxableInThisBracket * taxBrackets[i].rate;
      }
    }
  }

  return tax;
};

// Updated SSNIT calculation with correct rates
const calculateSSNIT = (basicSalary) => {
  // SSNIT employee contribution is 5.5% of basic salary
  // Cap is GHS 1,348.92 per month (GHS 16,187.04 annually)
  const monthlyCap = 1348.92;

  const taxableSSNIT = Math.min(basicSalary, monthlyCap);
  return taxableSSNIT * 0.055; // 5.5% employee contribution
};

// Employer SSNIT contribution (13.5%)
const calculateSSNITEmployer = (basicSalary) => {
  const annualCap = 16187.04;
  const monthlyCap = annualCap / 12;

  const taxableSSNIT = Math.min(basicSalary, monthlyCap);
  return taxableSSNIT * 0.135; // 13.5% employer contribution
};

const calculateGHATaxWithRelief = (monthlyIncome) => {
  const monthlyTax = calculateGHATax(monthlyIncome);
  const monthlyRelief = 33.5; // GHS 402 annually / 12 months

  return Math.max(0, monthlyTax - monthlyRelief);
};

// GET /api/payroll/staff - List all staff with pagination
const getStaff = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      category_id,
      is_active = "true",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = ["1=1"];
    let queryParams = [];

    if (search) {
      whereConditions.push(
        "(se.first_name LIKE ? OR se.last_name LIKE ? OR se.staff_number LIKE ?)"
      );
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category_id) {
      whereConditions.push("se.category_id = ?");
      queryParams.push(category_id);
    }

    if (is_active === "true") {
      whereConditions.push("se.is_active = TRUE");
    } else if (is_active === "false") {
      whereConditions.push("se.is_active = FALSE");
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM staff_employees se WHERE ${whereConditions.join(
        " AND "
      )}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    // Get paginated data
    queryParams.push(limitNum, offset);
    const [staff] = await pool.query(
      `SELECT 
        se.*,
        sc.category_name,
        CONCAT(se.first_name, ' ', se.last_name) as full_name,
        DATEDIFF(CURDATE(), se.employment_date) as days_employed
       FROM staff_employees se
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       WHERE ${whereConditions.join(" AND ")}
       ORDER BY se.first_name, se.last_name
       LIMIT ? OFFSET ?`,
      queryParams
    );

    // Get categories for filter
    const [categories] = await pool.query(
      "SELECT * FROM staff_categories ORDER BY category_name"
    );

    res.json({
      staff,
      categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

// POST /api/payroll/staff - Add new staff
const addStaff = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      staff_number,
      first_name,
      last_name,
      category_id,
      employment_date,
      bank_name,
      bank_account_number,
      bank_branch,
      mobile_money_number,
      mobile_money_provider,
      contact_phone,
      emergency_contact,
      emergency_phone,
    } = req.body;

    // Check if staff number exists
    const [existing] = await connection.query(
      "SELECT id FROM staff_employees WHERE staff_number = ?",
      [staff_number]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Staff number already exists" });
    }

    // Insert staff
    const [result] = await connection.query(
      `INSERT INTO staff_employees (
        staff_number, first_name, last_name, category_id, employment_date,
        bank_name, bank_account_number, bank_branch, mobile_money_number,
        mobile_money_provider, contact_phone, emergency_contact, emergency_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_number,
        first_name,
        last_name,
        category_id,
        employment_date,
        bank_name,
        bank_account_number,
        bank_branch,
        mobile_money_number,
        mobile_money_provider,
        contact_phone,
        emergency_contact,
        emergency_phone,
      ]
    );

    await connection.commit();

    // Return created staff
    const [newStaff] = await connection.query(
      `SELECT se.*, sc.category_name 
       FROM staff_employees se
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       WHERE se.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newStaff[0]);
  } catch (error) {
    await connection.rollback();
    console.error("Error adding staff:", error);
    res.status(500).json({ error: "Failed to add staff" });
  } finally {
    connection.release();
  }
};

// GET /api/payroll/periods - Get payroll periods
const getPayrollPeriods = async (req, res) => {
  try {
    const [periods] = await pool.query(`
      SELECT 
        pp.*, 
        u.username as processed_by_name,
        COUNT(pe.id) as staff_count,
        COALESCE(SUM(pe.total_gross), 0) as period_gross,
        COALESCE(SUM(pe.total_deductions), 0) as period_deductions,
        COALESCE(SUM(pe.net_salary), 0) as period_net
      FROM payroll_periods pp
      LEFT JOIN payroll_entries pe ON pp.id = pe.period_id
      LEFT JOIN users u ON pp.processed_by = u.id
      GROUP BY pp.id, u.username
      ORDER BY pp.period_year DESC, pp.period_month DESC
    `);

    // Format the data properly
    const formattedPeriods = periods.map((period) => ({
      ...period,
      period_gross: parseFloat(period.period_gross) || 0,
      period_deductions: parseFloat(period.period_deductions) || 0,
      period_net: parseFloat(period.period_net) || 0,
      staff_count: parseInt(period.staff_count) || 0,
      month_name: getMonthName(period.period_month),
    }));

    res.json(formattedPeriods);
  } catch (error) {
    console.error("Error fetching payroll periods:", error);
    res.status(500).json({ error: "Failed to fetch payroll periods" });
  }
};

// Helper function to get month name
const getMonthName = (monthNumber) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNumber - 1] || `Month ${monthNumber}`;
};

// POST /api/payroll/periods - Create new period
const createPayrollPeriod = async (req, res) => {
  try {
    const { period_year, period_month, start_date, end_date } = req.body;

    // Check if period exists
    const [existing] = await pool.query(
      "SELECT id FROM payroll_periods WHERE period_year = ? AND period_month = ?",
      [period_year, period_month]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Payroll period already exists" });
    }

    const [result] = await pool.query(
      `INSERT INTO payroll_periods (period_year, period_month, start_date, end_date)
       VALUES (?, ?, ?, ?)`,
      [period_year, period_month, start_date, end_date]
    );

    const [newPeriod] = await pool.query(
      "SELECT * FROM payroll_periods WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(newPeriod[0]);
  } catch (error) {
    console.error("Error creating payroll period:", error);
    res.status(500).json({ error: "Failed to create payroll period" });
  }
};


// POST /api/payroll/save-entry - Save payroll entry
const calculatePayroll = async (req, res) => {
  try {
    const {
      staff_id,
      period_id,
      basic_salary,
      housing_allowance = 0,
      transport_allowance = 0,
      medical_allowance = 0,
      other_allowance = 0,
      allowance_description = "",
      welfare_deduction = 0,
      loan_deduction = 0,
      other_deduction = 0,
      deduction_description = "",
    } = req.body;

    // Get staff details
    const [staff] = await pool.query(
      "SELECT * FROM staff_employees WHERE id = ?",
      [staff_id]
    );

    if (staff.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Calculate SSNIT first
    const ssnit_employee = calculateSSNIT(basic_salary);
    const ssnit_employer = calculateSSNITEmployer(basic_salary);

    // Calculate Ghana tax on annual income AFTER SSNIT deduction
    const annualIncome = basic_salary * 12;
    const income_tax = calculateGHATax(annualIncome);

    // Calculate totals
    const total_gross =
      basic_salary +
      housing_allowance +
      transport_allowance +
      medical_allowance +
      other_allowance;

    const total_deductions =
      income_tax +
      ssnit_employee +
      welfare_deduction +
      loan_deduction +
      other_deduction;

    const net_salary = total_gross - total_deductions;

    res.json({
      calculated: {
        income_tax: parseFloat(income_tax.toFixed(2)),
        ssnit_employee: parseFloat(ssnit_employee.toFixed(2)),
        ssnit_employer: parseFloat(ssnit_employer.toFixed(2)),
        total_gross: parseFloat(total_gross.toFixed(2)),
        total_deductions: parseFloat(total_deductions.toFixed(2)),
        net_salary: parseFloat(net_salary.toFixed(2)),
      },
      summary: {
        staff_name: `${staff[0].first_name} ${staff[0].last_name}`,
        staff_number: staff[0].staff_number,
      },
    });
  } catch (error) {
    console.error("Error calculating payroll:", error);
    res.status(500).json({ error: "Failed to calculate payroll" });
  }
};

const savePayrollEntry = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      staff_id,
      period_id,
      basic_salary,
      housing_allowance = 0,
      transport_allowance = 0,
      medical_allowance = 0,
      other_allowance = 0,
      allowance_description = "",
      welfare_deduction = 0,
      loan_deduction = 0,
      other_deduction = 0,
      deduction_description = "",
      created_by,
    } = req.body;

    // Calculate Ghana tax
    const annualIncome = basic_salary * 12;
    const income_tax = calculateGHATax(annualIncome);
    const ssnit_employee = calculateSSNIT(basic_salary);

    // Check if entry exists
    const [existing] = await connection.query(
      "SELECT id FROM payroll_entries WHERE staff_id = ? AND period_id = ?",
      [staff_id, period_id]
    );

    let result;
    if (existing.length > 0) {
      // Update existing
      result = await connection.query(
        `UPDATE payroll_entries SET
         basic_salary = ?,
         housing_allowance = ?,
         transport_allowance = ?,
         medical_allowance = ?,
         other_allowance = ?,
         allowance_description = ?,
         income_tax = ?,
         ssnit_employee = ?,
         ssnit_employer = ?,
         welfare_deduction = ?,
         loan_deduction = ?,
         other_deduction = ?,
         deduction_description = ?
         WHERE id = ?`,
        [
          basic_salary,
          housing_allowance,
          transport_allowance,
          medical_allowance,
          other_allowance,
          allowance_description,
          income_tax,
          ssnit_employee,
          basic_salary * 0.13,
          welfare_deduction,
          loan_deduction,
          other_deduction,
          deduction_description,
          existing[0].id,
        ]
      );
    } else {
      // Create new
      result = await connection.query(
        `INSERT INTO payroll_entries (
          staff_id, period_id, basic_salary,
          housing_allowance, transport_allowance, medical_allowance, other_allowance,
          allowance_description, income_tax, ssnit_employee, ssnit_employer,
          welfare_deduction, loan_deduction, other_deduction, deduction_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          staff_id,
          period_id,
          basic_salary,
          housing_allowance,
          transport_allowance,
          medical_allowance,
          other_allowance,
          allowance_description,
          income_tax,
          ssnit_employee,
          basic_salary * 0.13,
          welfare_deduction,
          loan_deduction,
          other_deduction,
          deduction_description,
        ]
      );
    }

    await connection.commit();

    // Get updated entry
    const [entry] = await connection.query(
      `SELECT pe.*, 
              se.first_name, se.last_name, se.staff_number,
              sc.category_name,
              pp.period_year, pp.period_month
       FROM payroll_entries pe
       LEFT JOIN staff_employees se ON pe.staff_id = se.id
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       LEFT JOIN payroll_periods pp ON pe.period_id = pp.id
       WHERE pe.staff_id = ? AND pe.period_id = ?`,
      [staff_id, period_id]
    );

    res.json({
      success: true,
      message: "Payroll entry saved successfully",
      entry: entry[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error saving payroll entry:", error);
    res.status(500).json({ error: "Failed to save payroll entry" });
  } finally {
    connection.release();
  }
};

// GET /api/payroll/entries/:period_id - Get payroll entries for period
const getPayrollEntries = async (req, res) => {
  try {
    const { period_id } = req.params;

    const [entries] = await pool.query(
      `SELECT 
        pe.*,
        se.staff_number,
        CONCAT(se.first_name, ' ', se.last_name) as staff_name,
        sc.category_name,
        se.bank_name,
        se.bank_account_number,
        se.mobile_money_number,
        se.mobile_money_provider
       FROM payroll_entries pe
       LEFT JOIN staff_employees se ON pe.staff_id = se.id
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       WHERE pe.period_id = ?
       ORDER BY se.first_name, se.last_name`,
      [period_id]
    );

    // Get period details
    const [period] = await pool.query(
      "SELECT * FROM payroll_periods WHERE id = ?",
      [period_id]
    );

    res.json({
      entries,
      period: period[0] || {},
      summary: {
        staff_count: entries.length,
        total_gross: entries.reduce(
          (sum, e) => sum + parseFloat(e.total_gross),
          0
        ),
        total_deductions: entries.reduce(
          (sum, e) => sum + parseFloat(e.total_deductions),
          0
        ),
        total_net: entries.reduce(
          (sum, e) => sum + parseFloat(e.net_salary),
          0
        ),
        total_ssnit_employer: entries.reduce(
          (sum, e) => sum + parseFloat(e.ssnit_employer),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching payroll entries:", error);
    res.status(500).json({ error: "Failed to fetch payroll entries" });
  }
};

// PUT /api/payroll/approve/:id - Approve payroll entry
const approvePayrollEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, payment_date, payment_method, payment_reference } =
      req.body;

    await pool.query(
      `UPDATE payroll_entries SET
       is_approved = TRUE,
       approved_by = ?,
       approved_at = CURRENT_TIMESTAMP,
       payment_date = ?,
       payment_method = ?,
       payment_reference = ?
       WHERE id = ?`,
      [approved_by, payment_date, payment_method, payment_reference, id]
    );

    res.json({
      success: true,
      message: "Payroll entry approved successfully",
    });
  } catch (error) {
    console.error("Error approving payroll entry:", error);
    res.status(500).json({ error: "Failed to approve payroll entry" });
  }
};

// POST /api/payroll/process/:period_id - Process entire period
const processPayrollPeriod = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { period_id } = req.params;
    const { processed_by } = req.body;

    // Get all entries for this period
    const [entries] = await connection.query(
      "SELECT * FROM payroll_entries WHERE period_id = ?",
      [period_id]
    );

    if (entries.length === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "No payroll entries found for this period" });
    }

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => {
        acc.total_gross += parseFloat(entry.total_gross) || 0;
        acc.total_deductions += parseFloat(entry.total_deductions) || 0;
        acc.total_net += parseFloat(entry.net_salary) || 0;
        return acc;
      },
      { total_gross: 0, total_deductions: 0, total_net: 0 }
    );

    // Update period
    await connection.query(
      `UPDATE payroll_periods SET
       is_processed = TRUE,
       processed_by = ?,
       processed_at = CURRENT_TIMESTAMP,
       total_gross = ?,
       total_deductions = ?,
       total_net = ?
       WHERE id = ?`,
      [
        processed_by,
        totals.total_gross,
        totals.total_deductions,
        totals.total_net,
        period_id,
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Payroll period processed successfully for ${entries.length} staff`,
      totals,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error processing payroll period:", error);
    res.status(500).json({ error: "Failed to process payroll period" });
  } finally {
    connection.release();
  }
};

// GET /api/payroll/payslip/:id - Generate individual payslip PDF
const generatePayslipPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Get payroll entry with all details
    const [entries] = await pool.query(
      `SELECT 
        pe.*,
        se.staff_number,
        se.first_name,
        se.last_name,
        se.bank_name,
        se.bank_account_number,
        se.mobile_money_number,
        sc.category_name,
        pp.period_year,
        pp.period_month,
        pp.start_date,
        pp.end_date,
        u.username as approved_by_name
       FROM payroll_entries pe
       LEFT JOIN staff_employees se ON pe.staff_id = se.id
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       LEFT JOIN payroll_periods pp ON pe.period_id = pp.id
       LEFT JOIN users u ON pe.approved_by = u.id
       WHERE pe.id = ?`,
      [id]
    );

    if (entries.length === 0) {
      return res.status(404).json({ error: "Payroll entry not found" });
    }

    const entry = entries[0];

    // Get school settings
    const [schoolSettings] = await pool.query(
      "SELECT * FROM school_settings ORDER BY id DESC LIMIT 1"
    );

    const school = schoolSettings[0] || {
      school_name: "School Manager Academy",
      address: "123 Education Street, Learning City",
      phone_numbers: '["(233) 123-4567"]',
    };

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor = [41, 128, 185];

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("PAYSLIP", pageWidth / 2, 20, { align: "center" });

    // School info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const schoolName = school.school_name || "School Manager Academy";
    doc.text(schoolName, 20, 30);

    if (school.address) {
      doc.text(school.address, 20, 35);
    }

    // Period info
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const periodMonth =
      monthNames[entry.period_month - 1] || `Month ${entry.period_month}`;

    doc.text(
      `Pay Period: ${periodMonth} ${entry.period_year}`,
      pageWidth - 20,
      30,
      { align: "right" }
    );
    doc.text(
      `Payment Date: ${new Date(entry.payment_date).toLocaleDateString() || "Pending"}`,
      pageWidth - 20,
      35,
      { align: "right" }
    );

    // Employee info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE INFORMATION", 20, 50);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const employeeInfo = [
      [`Name:`, `${entry.first_name} ${entry.last_name}`],
      [`Staff ID:`, entry.staff_number],
      [`Position:`, entry.category_name],
      [`Bank:`, entry.bank_name || "Not specified"],
      [`Account:`, entry.bank_account_number || "N/A"],
    ];

    employeeInfo.forEach(([label, value], index) => {
      doc.text(label, 25, 60 + index * 7);
      doc.text(value, 60, 60 + index * 7);
    });

    // Earnings section
    let yPosition = 100;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("EARNINGS", 20, yPosition);
    yPosition += 10;

    const earnings = [
      ["Basic Salary", `Ghc ${parseFloat(entry.basic_salary).toFixed(2)}`],
      [
        "Housing Allowance",
        `Ghc ${parseFloat(entry.housing_allowance).toFixed(2)}`,
      ],
      [
        "Transport Allowance",
        `Ghc ${parseFloat(entry.transport_allowance).toFixed(2)}`,
      ],
      [
        "Medical Allowance",
        `Ghc ${parseFloat(entry.medical_allowance).toFixed(2)}`,
      ],
      [
        "Other Allowance",
        `Ghc ${parseFloat(entry.other_allowance).toFixed(2)}`,
      ],
    ];

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    earnings.forEach(([description, amount], index) => {
      if (parseFloat(amount.split(" ")[1]) > 0) {
        doc.text(description, 25, yPosition + index * 7);
        doc.text(amount, pageWidth - 25, yPosition + index * 7, {
          align: "right",
        });
      }
    });

    yPosition +=
      earnings.filter((e) => parseFloat(e[1].split(" ")[1]) > 0).length * 7 + 5;

    // Total Gross
    doc.setFont("helvetica", "bold");
    doc.text("Total Gross", 25, yPosition);
    doc.text(
      `Ghc ${parseFloat(entry.total_gross).toFixed(2)}`,
      pageWidth - 25,
      yPosition,
      { align: "right" }
    );

    yPosition += 15;

    // Deductions section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DEDUCTIONS", 20, yPosition);
    yPosition += 10;

    const deductions = [
      ["Income Tax", `Ghc ${parseFloat(entry.income_tax).toFixed(2)}`],
      ["SSNIT (5.5%)", `Ghc ${parseFloat(entry.ssnit_employee).toFixed(2)}`],
      ["Welfare", `Ghc ${parseFloat(entry.welfare_deduction).toFixed(2)}`],
      ["Loan", `Ghc ${parseFloat(entry.loan_deduction).toFixed(2)}`],
      [
        "Other Deductions",
        `Ghc ${parseFloat(entry.other_deduction).toFixed(2)}`,
      ],
    ];

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    deductions.forEach(([description, amount], index) => {
      if (parseFloat(amount.split(" ")[1]) > 0) {
        doc.text(description, 25, yPosition + index * 7);
        doc.text(amount, pageWidth - 25, yPosition + index * 7, {
          align: "right",
        });
      }
    });

    yPosition +=
      deductions.filter((d) => parseFloat(d[1].split(" ")[1]) > 0).length * 7 +
      5;

    // Total Deductions
    doc.setFont("helvetica", "bold");
    doc.text("Total Deductions", 25, yPosition);
    doc.text(
      `Ghc ${parseFloat(entry.total_deductions).toFixed(2)}`,
      pageWidth - 25,
      yPosition,
      { align: "right" }
    );

    yPosition += 15;

    // Net Salary box
    doc.setFillColor(...primaryColor);
    doc.rect(20, yPosition, pageWidth - 40, 12, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("NET SALARY PAYABLE", 25, yPosition + 8);
    doc.text(
      `Ghc ${parseFloat(entry.net_salary).toFixed(2)}`,
      pageWidth - 25,
      yPosition + 8,
      { align: "right" }
    );

    yPosition += 25;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("This is a computer-generated payslip", pageWidth / 2, yPosition, {
      align: "center",
    });

    if (entry.approved_by_name) {
      doc.text(
        `Approved by: ${entry.approved_by_name}`,
        pageWidth / 2,
        yPosition + 5,
        { align: "center" }
      );
    }

    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      yPosition + 10,
      { align: "center" }
    );

    // Convert to buffer and send
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="payslip-${entry.staff_number}-${entry.period_month}-${entry.period_year}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating payslip:", error);
    res.status(500).json({ error: "Failed to generate payslip" });
  }
};

// GET /api/payroll/report/:period_id - Generate payroll report (PDF)
const generatePayrollReport = async (req, res) => {
  try {
    const { period_id } = req.params;

    // Get all entries for period
    const [entries] = await pool.query(
      `SELECT 
        pe.*,
        se.staff_number,
        CONCAT(se.first_name, ' ', se.last_name) as staff_name,
        sc.category_name
       FROM payroll_entries pe
       LEFT JOIN staff_employees se ON pe.staff_id = se.id
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       WHERE pe.period_id = ?
       ORDER BY se.first_name, se.last_name`,
      [period_id]
    );

    if (entries.length === 0) {
      return res
        .status(404)
        .json({ error: "No payroll entries found for this period" });
    }

    // Get period details
    const [period] = await pool.query(
      "SELECT * FROM payroll_periods WHERE id = ?",
      [period_id]
    );

    // Get school settings
    const [schoolSettings] = await pool.query(
      "SELECT * FROM school_settings ORDER BY id DESC LIMIT 1"
    );

    const school = schoolSettings[0] || {
      school_name: "School Manager Academy",
    };

    // Create PDF
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL REPORT", pageWidth / 2, 20, { align: "center" });

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const periodMonth =
      monthNames[period[0].period_month - 1] ||
      `Month ${period[0].period_month}`;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${periodMonth} ${period[0].period_year}`, 20, 35);
    doc.text(`School: ${school.school_name}`, pageWidth - 20, 35, {
      align: "right",
    });

    // Create table data
    const tableData = entries.map((entry, index) => [
      index + 1,
      entry.staff_number,
      entry.staff_name,
      entry.category_name,
      `Ghc ${parseFloat(entry.basic_salary).toFixed(2)}`,
      `Ghc ${parseFloat(entry.total_gross).toFixed(2)}`,
      `Ghc ${parseFloat(entry.total_deductions).toFixed(2)}`,
      `Ghc ${parseFloat(entry.net_salary).toFixed(2)}`,
      entry.is_approved ? "Approved" : "Pending",
    ]);

    // Generate table
    autoTable(doc, {
      startY: 45,
      head: [
        [
          "#",
          "Staff ID",
          "Name",
          "Position",
          "Basic",
          "Gross",
          "Deductions",
          "Net",
          "Status",
        ],
      ],
      body: tableData,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      margin: { left: 10, right: 10 },
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => {
        acc.total_gross += parseFloat(entry.total_gross) || 0;
        acc.total_deductions += parseFloat(entry.total_deductions) || 0;
        acc.total_net += parseFloat(entry.net_salary) || 0;
        acc.total_ssnit_employer += parseFloat(entry.ssnit_employer) || 0;
        return acc;
      },
      {
        total_gross: 0,
        total_deductions: 0,
        total_net: 0,
        total_ssnit_employer: 0,
      }
    );

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 20, finalY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const summaryLines = [
      `Total Staff: ${entries.length}`,
      `Total Gross Pay: Ghc ${totals.total_gross.toFixed(2)}`,
      `Total Deductions: Ghc ${totals.total_deductions.toFixed(2)}`,
      `Total Net Pay: Ghc ${totals.total_net.toFixed(2)}`,
      `Total SSNIT Employer (13%): Ghc ${totals.total_ssnit_employer.toFixed(
        2
      )}`,
    ];

    summaryLines.forEach((line, index) => {
      doc.text(line, 20, finalY + 10 + index * 6);
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payroll-report-${period[0].period_month}-${period[0].period_year}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating payroll report:", error);
    res.status(500).json({ error: "Failed to generate payroll report" });
  }
};

// GET /api/payroll/previous-entry/:staff_id - Get previous payroll entry for staff
const getPreviousPayrollEntry = async (req, res) => {
  try {
    const { staff_id } = req.params;

    // Get the most recent approved payroll entry for this staff
    const [entries] = await pool.query(
      `SELECT pe.*, pp.period_year, pp.period_month, pp.is_processed
       FROM payroll_entries pe
       LEFT JOIN payroll_periods pp ON pe.period_id = pp.id
       WHERE pe.staff_id = ? 
       AND pe.is_approved = TRUE
       ORDER BY pp.period_year DESC, pp.period_month DESC
       LIMIT 1`,
      [staff_id]
    );

    if (entries.length === 0) {
      return res.json({ exists: false, message: "No previous payroll found" });
    }

    res.json({
      exists: true,
      entry: entries[0],
      message: "Previous payroll entry found",
    });
  } catch (error) {
    console.error("Error fetching previous payroll:", error);
    res.status(500).json({ error: "Failed to fetch previous payroll" });
  }
};
const copyEntriesFromPreviousPeriod = async (req, res) => {
  try {
    const { period_id } = req.params;
    const { adjustments = {} } = req.body; // Optional adjustments like % increase

    // Get current period
    const [currentPeriod] = await pool.query(
      "SELECT period_year, period_month FROM payroll_periods WHERE id = ?",
      [period_id]
    );

    if (currentPeriod.length === 0) {
      return res.status(404).json({ error: "Period not found" });
    }

    // Find previous period (same year, previous month)
    const [previousPeriod] = await pool.query(
      `SELECT id FROM payroll_periods 
       WHERE period_year = ? AND period_month = ?
       ORDER BY period_year DESC, period_month DESC
       LIMIT 1`,
      [currentPeriod[0].period_year, currentPeriod[0].period_month - 1 || 12]
    );

    if (previousPeriod.length === 0) {
      return res.json({
        success: false,
        message: "No previous period found to copy from",
      });
    }

    // Get all entries from previous period
    const [previousEntries] = await pool.query(
      `SELECT * FROM payroll_entries 
       WHERE period_id = ? AND is_approved = TRUE`,
      [previousPeriod[0].id]
    );

    if (previousEntries.length === 0) {
      return res.json({
        success: false,
        message: "No approved payroll entries found in previous period",
      });
    }

    let createdCount = 0;
    let skippedCount = 0;

    // Copy each entry with optional adjustments
    for (const entry of previousEntries) {
      // Check if entry already exists for this period
      const [existing] = await pool.query(
        "SELECT id FROM payroll_entries WHERE staff_id = ? AND period_id = ?",
        [entry.staff_id, period_id]
      );

      if (existing.length > 0) {
        skippedCount++;
        continue;
      }

      // Apply adjustments if provided (e.g., 5% increase)
      let basic_salary = entry.basic_salary;
      if (adjustments.salary_increase_percent) {
        basic_salary =
          basic_salary * (1 + adjustments.salary_increase_percent / 100);
      }

      // Create new entry
      await pool.query(
        `INSERT INTO payroll_entries (
          staff_id, period_id, basic_salary,
          housing_allowance, transport_allowance, medical_allowance, other_allowance,
          allowance_description, income_tax, ssnit_employee, ssnit_employer,
          welfare_deduction, loan_deduction, other_deduction, deduction_description,
          is_approved
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [
          entry.staff_id,
          period_id,
          basic_salary,
          entry.housing_allowance,
          entry.transport_allowance,
          entry.medical_allowance,
          entry.other_allowance,
          entry.allowance_description,
          entry.income_tax,
          entry.ssnit_employee,
          entry.ssnit_employer,
          entry.welfare_deduction,
          entry.loan_deduction,
          entry.other_deduction,
          entry.deduction_description,
        ]
      );

      createdCount++;
    }

    res.json({
      success: true,
      message: `Copied ${createdCount} payroll entries from previous period. ${skippedCount} skipped (already exist).`,
      created: createdCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Error copying payroll entries:", error);
    res.status(500).json({ error: "Failed to copy payroll entries" });
  }
};

// GET /api/payroll/entry/:id - Get specific payroll entry
const getPayrollEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [entries] = await pool.query(
      `SELECT 
        pe.*,
        se.staff_number,
        se.first_name,
        se.last_name,
        se.category_id,
        sc.category_name,
        se.bank_name,
        se.bank_account_number,
        se.mobile_money_number,
        se.mobile_money_provider,
        pp.period_year,
        pp.period_month,
        pp.start_date,
        pp.end_date,
        pp.is_processed,
        u.username as approved_by_name
       FROM payroll_entries pe
       LEFT JOIN staff_employees se ON pe.staff_id = se.id
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       LEFT JOIN payroll_periods pp ON pe.period_id = pp.id
       LEFT JOIN users u ON pe.approved_by = u.id
       WHERE pe.id = ?`,
      [id]
    );

    if (entries.length === 0) {
      return res.status(404).json({ error: "Payroll entry not found" });
    }

    res.json(entries[0]);
  } catch (error) {
    console.error("Error fetching payroll entry:", error);
    res.status(500).json({ error: "Failed to fetch payroll entry" });
  }
};

// PUT /api/payroll/update-entry/:id - Update payroll entry
const updatePayrollEntry = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      basic_salary,
      housing_allowance = 0,
      transport_allowance = 0,
      medical_allowance = 0,
      other_allowance = 0,
      allowance_description = "",
      welfare_deduction = 0,
      loan_deduction = 0,
      other_deduction = 0,
      deduction_description = "",
    } = req.body;

    console.log("Updating payroll entry:", id, req.body);

    // First check if period is processed
    const [periodCheck] = await connection.query(
      `SELECT pp.is_processed 
       FROM payroll_entries pe
       LEFT JOIN payroll_periods pp ON pe.period_id = pp.id
       WHERE pe.id = ?`,
      [id]
    );

    if (periodCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entry not found" });
    }

    if (periodCheck[0].is_processed) {
      await connection.rollback();
      return res.status(400).json({ error: "Cannot edit processed period" });
    }

    // Parse values
    const basicSalary = parseFloat(basic_salary) || 0;
    const housingAllowance = parseFloat(housing_allowance) || 0;
    const transportAllowance = parseFloat(transport_allowance) || 0;
    const medicalAllowance = parseFloat(medical_allowance) || 0;
    const otherAllowance = parseFloat(other_allowance) || 0;
    const welfareDeduction = parseFloat(welfare_deduction) || 0;
    const loanDeduction = parseFloat(loan_deduction) || 0;
    const otherDeductionValue = parseFloat(other_deduction) || 0;

    // Recalculate taxes
    const annualIncome = basicSalary * 12;
    const income_tax = calculateGHATax(annualIncome);
    const ssnit_employee = calculateSSNIT(basicSalary);
    const ssnit_employer = calculateSSNITEmployer(basicSalary);

    // Update the entry
    await connection.query(
      `UPDATE payroll_entries SET
       basic_salary = ?,
       housing_allowance = ?,
       transport_allowance = ?,
       medical_allowance = ?,
       other_allowance = ?,
       allowance_description = ?,
       income_tax = ?,
       ssnit_employee = ?,
       ssnit_employer = ?,
       welfare_deduction = ?,
       loan_deduction = ?,
       other_deduction = ?,
       deduction_description = ?,
       is_approved = FALSE,
       approved_by = NULL,
       approved_at = NULL
       WHERE id = ?`,
      [
        basicSalary,
        housingAllowance,
        transportAllowance,
        medicalAllowance,
        otherAllowance,
        allowance_description,
        income_tax,
        ssnit_employee,
        ssnit_employer,
        welfareDeduction,
        loanDeduction,
        otherDeductionValue,
        deduction_description,
        id,
      ]
    );

    await connection.commit();

    // Get updated entry
    const [updatedEntry] = await connection.query(
      `SELECT pe.*, 
              se.first_name, se.last_name, se.staff_number,
              sc.category_name
       FROM payroll_entries pe
       LEFT JOIN staff_employees se ON pe.staff_id = se.id
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       WHERE pe.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Payroll entry updated successfully",
      entry: updatedEntry[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating payroll entry:", error);
    res.status(500).json({
      error: "Failed to update payroll entry",
      details: error.message,
    });
  } finally {
    connection.release();
  }
};
// DELETE /api/payroll/delete-entry/:id - Delete payroll entry
const deletePayrollEntry = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Check if period is processed
    const [periodCheck] = await connection.query(
      `SELECT pp.is_processed 
       FROM payroll_entries pe
       LEFT JOIN payroll_periods pp ON pe.period_id = pp.id
       WHERE pe.id = ?`,
      [id]
    );

    if (periodCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Entry not found" });
    }

    if (periodCheck[0].is_processed) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Cannot delete from processed period" });
    }

    await connection.query("DELETE FROM payroll_entries WHERE id = ?", [id]);

    await connection.commit();

    res.json({
      success: true,
      message: "Payroll entry deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting payroll entry:", error);
    res.status(500).json({ error: "Failed to delete payroll entry" });
  } finally {
    connection.release();
  }
};

const deletePayrollPeriod = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Check if period is processed
    const [periodCheck] = await connection.query(
      "SELECT is_processed FROM payroll_periods WHERE id = ?",
      [id]
    );

    if (periodCheck.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Period not found" });
    }

    if (periodCheck[0].is_processed) {
      await connection.rollback();
      return res.status(400).json({ error: "Cannot delete processed period" });
    }

    await connection.query("DELETE FROM payroll_periods WHERE id = ?", [id]);

    await connection.commit();

    res.json({
      success: true,
      message: "Payroll period deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting payroll period:", error);
    res.status(500).json({ error: "Failed to delete payroll period" });
  } finally {
    connection.release();
  }
};

// POST /api/payroll/approve-bulk - Bulk approve multiple entries
const approvePayrollEntriesBulk = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      entry_ids,
      approved_by,
      payment_date,
      payment_method,
      payment_reference,
    } = req.body;

    if (!entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: "Entry IDs array is required and must not be empty",
      });
    }

    if (!approved_by) {
      await connection.rollback();
      return res.status(400).json({
        error: "Approved by user ID is required",
      });
    }

    const results = {
      total: entry_ids.length,
      approved: 0,
      errors: [],
      already_approved: 0,
    };

    // Process each entry
    for (const entryId of entry_ids) {
      try {
        // Check if entry exists and is not already approved
        const [entry] = await connection.query(
          `SELECT id, is_approved FROM payroll_entries WHERE id = ?`,
          [entryId]
        );

        if (entry.length === 0) {
          results.errors.push({
            entry_id: entryId,
            error: "Entry not found",
          });
          continue;
        }

        if (entry[0].is_approved) {
          results.already_approved++;
          continue;
        }

        // Approve the entry
        await connection.query(
          `UPDATE payroll_entries SET
           is_approved = TRUE,
           approved_by = ?,
           approved_at = CURRENT_TIMESTAMP,
           payment_date = ?,
           payment_method = ?,
           payment_reference = ?
           WHERE id = ?`,
          [
            approved_by,
            payment_date || new Date().toISOString().split("T")[0],
            payment_method || "Bank Transfer",
            payment_reference || `BULK-${Date.now()}`,
            entryId,
          ]
        );

        results.approved++;
      } catch (error) {
        results.errors.push({
          entry_id: entryId,
          error: error.message,
        });
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Bulk approval completed. ${results.approved} entries approved, ${results.already_approved} already approved.`,
      ...results,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error bulk approving payroll entries:", error);
    res.status(500).json({
      error: "Failed to bulk approve payroll entries",
      details: error.message,
    });
  } finally {
    connection.release();
  }
};

const getStaffCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT * FROM staff_categories 
      ORDER BY category_name
    `);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching staff categories:", error);
    res.status(500).json({ error: "Failed to fetch staff categories" });
  }
};

const createStaffCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;

    const [existing] = await pool.query(
      "SELECT id FROM staff_categories WHERE category_name = ?",
      [category_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Category name already exists" });
    }

    const [result] = await pool.query(
      "INSERT INTO staff_categories (category_name, description) VALUES (?, ?)",
      [category_name, description]
    );

    res.status(201).json({ 
      id: result.insertId, 
      category_name, 
      description 
    });
  } catch (error) {
    console.error("Error creating staff category:", error);
    res.status(500).json({ error: "Failed to create staff category" });
  }
};

// Bulk import staff
const bulkImportStaff = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { staff } = req.body;
    const results = {
      imported: 0,
      errors: [],
      duplicates: 0
    };

    for (const staffData of staff) {
      try {
        // Check if staff number exists
        const [existing] = await connection.query(
          "SELECT id FROM staff_employees WHERE staff_number = ?",
          [staffData.staff_number]
        );

        if (existing.length > 0) {
          results.duplicates++;
          results.errors.push({
            staff_number: staffData.staff_number,
            error: "Staff number already exists"
          });
          continue;
        }

        // Insert staff
        await connection.query(
          `INSERT INTO staff_employees (
            staff_number, first_name, last_name, category_id,
            employment_date, contact_phone, bank_name, bank_account_number,
            bank_branch, mobile_money_number, mobile_money_provider,
            emergency_contact, emergency_phone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            staffData.staff_number,
            staffData.first_name,
            staffData.last_name,
            staffData.category_id,
            staffData.employment_date,
            staffData.contact_phone,
            staffData.bank_name || null,
            staffData.bank_account_number || null,
            staffData.bank_branch || null,
            staffData.mobile_money_number || null,
            staffData.mobile_money_provider || null,
            staffData.emergency_contact || null,
            staffData.emergency_phone || null
          ]
        );

        results.imported++;
      } catch (error) {
        results.errors.push({
          staff_number: staffData.staff_number,
          error: error.message
        });
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Imported ${results.imported} staff members successfully`,
      ...results
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in bulk staff import:", error);
    res.status(500).json({ 
      error: "Failed to import staff", 
      details: error.message 
    });
  } finally {
    connection.release();
  }
};



module.exports = {
  getStaff,
  addStaff,
  getPayrollPeriods,
  createPayrollPeriod,
  calculatePayroll,
  savePayrollEntry,
  getPayrollEntries,
  approvePayrollEntry,
  processPayrollPeriod,
  generatePayslipPDF,
  generatePayrollReport,
  getPreviousPayrollEntry,
  copyEntriesFromPreviousPeriod,
  getPayrollEntryById,
  updatePayrollEntry,
  deletePayrollEntry,
  deletePayrollPeriod,
  approvePayrollEntriesBulk,
  getStaffCategories,
  createStaffCategory,
  bulkImportStaff,
};
