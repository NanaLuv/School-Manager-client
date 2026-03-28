const pool = require("../db");
const { jsPDF } = require("jspdf");
const { autoTable } = require("jspdf-autotable");
const XLSX = require("xlsx");

// GET /api/finance/profit-loss - Get comprehensive P&L data
const getProfitLossData = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      period = "monthly", // daily, weekly, monthly, quarterly, yearly
      include_details = "false",
      category_filter,
    } = req.query;

    // Default to current month if no dates provided
    const defaultStartDate =
      start_date ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const defaultEndDate = end_date || new Date().toISOString().split("T")[0];

    // ==================== INCOME CALCULATIONS ====================

    // 1. Student Term Bills (Fees Paid)
    const [feeIncome] = await pool.query(
      `SELECT 
         COALESCE(SUM(stb.paid_amount), 0) as total_fees_paid,
         COUNT(DISTINCT stb.student_id) as fee_paying_students,
         COUNT(DISTINCT CASE WHEN stb.is_fully_paid = TRUE THEN stb.student_id END) as fully_paid_students,
         AVG(stb.paid_amount) as avg_fee_per_student
       FROM student_term_bills stb
       WHERE stb.is_finalized = TRUE
         AND stb.last_payment_date BETWEEN ? AND ?
         AND stb.paid_amount > 0`,
      [defaultStartDate, defaultEndDate]
    );

    // 2. Daily Cash Receipts (Other Income)
    const [cashReceipts] = await pool.query(
      `SELECT 
         COALESCE(SUM(cr.amount), 0) as total_cash_receipts,
         COUNT(DISTINCT cr.fee_category_id) as receipt_categories
       FROM daily_cash_receipts cr
       LEFT JOIN fee_categories fc ON cr.fee_category_id = fc.id
       WHERE cr.receipt_date BETWEEN ? AND ?`,
      [defaultStartDate, defaultEndDate]
    );

    // Get cash receipt details separately if needed
    let receiptDetails = [];
    if (include_details === "true") {
      const [details] = await pool.query(
        `SELECT 
           fc.category_name,
           SUM(cr.amount) as amount,
           cr.source
         FROM daily_cash_receipts cr
         LEFT JOIN fee_categories fc ON cr.fee_category_id = fc.id
         WHERE cr.receipt_date BETWEEN ? AND ?
         GROUP BY fc.category_name, cr.source
         ORDER BY amount DESC`,
        [defaultStartDate, defaultEndDate]
      );
      receiptDetails = details;
    }

    // 3. Total Income Calculation
    const totalIncome =
      parseFloat(feeIncome[0]?.total_fees_paid || 0) +
      parseFloat(cashReceipts[0]?.total_cash_receipts || 0);

    // ==================== EXPENDITURE CALCULATIONS ====================

    // 1. Expenses (PCV)
    const [expenses] = await pool.query(
      `SELECT 
         COALESCE(SUM(e.amount), 0) as total_expenses,
         COUNT(DISTINCT e.expense_category) as expense_categories
       FROM expenses e
       WHERE e.expense_date BETWEEN ? AND ?`,
      [defaultStartDate, defaultEndDate]
    );

    // Get expense details separately if needed
    let expenseDetails = [];
    if (include_details === "true") {
      const [details] = await pool.query(
        `SELECT 
           e.expense_category,
           e.amount,
           e.description,
           e.paid_to,
           e.expense_date
         FROM expenses e
         WHERE e.expense_date BETWEEN ? AND ?
         ORDER BY e.expense_date DESC`,
        [defaultStartDate, defaultEndDate]
      );
      expenseDetails = details;
    }

    // 2. Payroll (UPDATED: From payroll_entries table) - FIXED QUERY
    const [payroll] = await pool.query(
      `SELECT 
         COALESCE(SUM(pe.total_gross), 0) as total_payroll_gross,
         COALESCE(SUM(pe.total_deductions), 0) as total_payroll_deductions,
         COALESCE(SUM(pe.net_salary), 0) as total_payroll_net,
         COUNT(DISTINCT pe.id) as payroll_entries,
         COUNT(DISTINCT pe.staff_id) as staff_paid,
         AVG(pe.net_salary) as avg_salary
       FROM payroll_entries pe
       INNER JOIN payroll_periods pp ON pe.period_id = pp.id
       WHERE pe.is_approved = TRUE
         AND pp.is_processed = TRUE
         AND (
           (pp.start_date BETWEEN ? AND ?) 
           OR (pp.end_date BETWEEN ? AND ?)
           OR (pp.start_date <= ? AND pp.end_date >= ?)
         )`,
      [
        defaultStartDate, defaultEndDate, // start_date BETWEEN
        defaultStartDate, defaultEndDate, // end_date BETWEEN
        defaultStartDate, defaultEndDate  // period overlaps
      ]
    );
    
    // Get payroll details separately if needed
    let payrollDetails = [];
    let payrollCategoryBreakdown = [];
    
    if (include_details === "true") {
      // Get payroll details with period information
      const [details] = await pool.query(
        `SELECT 
           pe.staff_id,
           CONCAT(se.first_name, ' ', se.last_name) as staff_name,
           pe.total_gross,
           pe.total_deductions,
           pe.net_salary,
           sc.category_name,
           pp.period_month,
           pp.period_year,
           pp.start_date as period_start,
           pp.end_date as period_end
         FROM payroll_entries pe
         INNER JOIN payroll_periods pp ON pe.period_id = pp.id
         LEFT JOIN staff_employees se ON pe.staff_id = se.id
         LEFT JOIN staff_categories sc ON se.category_id = sc.id
         WHERE pe.is_approved = TRUE
           AND pp.is_processed = TRUE
           AND (
             (pp.start_date BETWEEN ? AND ?) 
             OR (pp.end_date BETWEEN ? AND ?)
             OR (pp.start_date <= ? AND pp.end_date >= ?)
           )
         ORDER BY pe.net_salary DESC`,
        [
          defaultStartDate, defaultEndDate,
          defaultStartDate, defaultEndDate,
          defaultStartDate, defaultEndDate
        ]
      );
      payrollDetails = details;
    
      // Get payroll category breakdown
      const [categories] = await pool.query(
        `SELECT 
           sc.category_name as category,
           COALESCE(SUM(pe.net_salary), 0) as amount,
           COUNT(DISTINCT pe.staff_id) as staff_count,
           AVG(pe.net_salary) as avg_salary
         FROM payroll_entries pe
         INNER JOIN payroll_periods pp ON pe.period_id = pp.id
         LEFT JOIN staff_employees se ON pe.staff_id = se.id
         LEFT JOIN staff_categories sc ON se.category_id = sc.id
         WHERE pe.is_approved = TRUE
           AND pp.is_processed = TRUE
           AND (
             (pp.start_date BETWEEN ? AND ?) 
             OR (pp.end_date BETWEEN ? AND ?)
             OR (pp.start_date <= ? AND pp.end_date >= ?)
           )
         GROUP BY sc.category_name
         ORDER BY amount DESC`,
        [
          defaultStartDate, defaultEndDate,
          defaultStartDate, defaultEndDate,
          defaultStartDate, defaultEndDate
        ]
      );
      payrollCategoryBreakdown = categories;
    }

    // 3. Total Expenditure Calculation
    const totalExpenditure =
      parseFloat(expenses[0]?.total_expenses || 0) +
      parseFloat(payroll[0]?.total_payroll_net || 0);

    // ==================== PROFIT/LOSS CALCULATION ====================
    const profitLoss = totalIncome - totalExpenditure;
    const profitMargin = totalIncome > 0 ? (profitLoss / totalIncome) * 100 : 0;

    // ==================== TREND ANALYSIS ====================

    // Get monthly trend for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const trendStartDate = sixMonthsAgo.toISOString().split("T")[0];

    const [monthlyTrend] = await pool.query(
      `WITH months AS (
         SELECT DATE_FORMAT(DATE_ADD(?, INTERVAL seq MONTH), '%Y-%m') as month
         FROM (SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) seq
       )
       SELECT 
         m.month,
         DATE_FORMAT(STR_TO_DATE(CONCAT(m.month, '-01'), '%Y-%m-%d'), '%M %Y') as month_name,
         
         -- Fees income
         COALESCE((
           SELECT SUM(stb.paid_amount)
           FROM student_term_bills stb
           WHERE DATE_FORMAT(stb.last_payment_date, '%Y-%m') = m.month
             AND stb.is_finalized = TRUE
         ), 0) as month_fees,
         
         -- Cash receipts
         COALESCE((
           SELECT SUM(cr.amount)
           FROM daily_cash_receipts cr
           WHERE DATE_FORMAT(cr.receipt_date, '%Y-%m') = m.month
         ), 0) as month_cash,
         
         -- Expenses
         COALESCE((
           SELECT SUM(e.amount)
           FROM expenses e
           WHERE DATE_FORMAT(e.expense_date, '%Y-%m') = m.month
         ), 0) as month_expenses,
         
         -- Payroll
         COALESCE((
           SELECT SUM(pe.net_salary)
           FROM payroll_entries pe
           INNER JOIN payroll_periods pp ON pe.period_id = pp.id
           WHERE DATE_FORMAT(pp.start_date, '%Y-%m') = m.month
             AND pe.is_approved = TRUE
             AND pp.is_processed = TRUE
         ), 0) as month_payroll
         
       FROM months m
       WHERE m.month >= DATE_FORMAT(?, '%Y-%m')
       GROUP BY m.month, month_name
       ORDER BY m.month`,
      [trendStartDate, trendStartDate],
    );

    // ==================== CATEGORY BREAKDOWN ====================

    const [incomeBreakdown] = await pool.query(
      `SELECT 
         'Student Fees' as category,
         COALESCE(SUM(stb.paid_amount), 0) as amount,
         COUNT(DISTINCT stb.student_id) as transactions
       FROM student_term_bills stb
       WHERE stb.last_payment_date BETWEEN ? AND ?
         AND stb.is_finalized = TRUE
       UNION ALL
       SELECT 
         COALESCE(fc.category_name, 'Other Income') as category,
         COALESCE(SUM(cr.amount), 0) as amount,
         COUNT(DISTINCT cr.id) as transactions
       FROM daily_cash_receipts cr
       LEFT JOIN fee_categories fc ON cr.fee_category_id = fc.id
       WHERE cr.receipt_date BETWEEN ? AND ?
       GROUP BY COALESCE(fc.category_name, 'Other Income')
       ORDER BY amount DESC`,
      [defaultStartDate, defaultEndDate, defaultStartDate, defaultEndDate]
    );

    const [expenseBreakdown] = await pool.query(
      `SELECT 
         'Payroll' as category,
         COALESCE(SUM(pe.net_salary), 0) as amount,
         COUNT(DISTINCT pe.id) as transactions
       FROM payroll_entries pe
       WHERE pe.payment_date BETWEEN ? AND ?
         AND pe.is_approved = TRUE
       UNION ALL
       SELECT 
         e.expense_category as category,
         COALESCE(SUM(e.amount), 0) as amount,
         COUNT(DISTINCT e.id) as transactions
       FROM expenses e
       WHERE e.expense_date BETWEEN ? AND ?
       GROUP BY e.expense_category
       ORDER BY amount DESC`,
      [defaultStartDate, defaultEndDate, defaultStartDate, defaultEndDate]
    );

    // ==================== PAYROLL CATEGORY BREAKDOWN ====================
    const [payrollCategoryData] = await pool.query(
      `SELECT 
         COALESCE(sc.category_name, 'Uncategorized', 'Other Staff') as category,
         COALESCE(SUM(pe.net_salary), 0) as amount,
         COUNT(DISTINCT pe.staff_id) as staff_count,
         AVG(pe.net_salary) as avg_salary
       FROM payroll_entries pe
       LEFT JOIN staff_employees se ON pe.staff_id = se.id
       LEFT JOIN staff_categories sc ON se.category_id = sc.id
       WHERE pe.is_approved = TRUE
         AND pe.payment_date BETWEEN ? AND ?
         AND pe.payment_date IS NOT NULL
       GROUP BY COALESCE(sc.category_name, 'Uncategorized', 'Other Staff')
       ORDER BY amount DESC`,
      [defaultStartDate, defaultEndDate],
    );

    // If still empty, try this debug version
    console.log("Payroll Category Data:", payrollCategoryData);

    // ==================== KEY METRICS ====================

    // Collection Efficiency
    const [collectionEfficiency] = await pool.query(
      `SELECT 
         COALESCE(SUM(stb.paid_amount), 0) as collected,
         COALESCE(SUM(stb.total_amount), 0) as billed,
         CASE 
           WHEN COALESCE(SUM(stb.total_amount), 0) > 0 
           THEN ROUND((SUM(stb.paid_amount) / SUM(stb.total_amount)) * 100, 2)
           ELSE 0 
         END as collection_rate
       FROM student_term_bills stb
       WHERE stb.is_finalized = TRUE
         AND stb.last_payment_date BETWEEN ? AND ?`,
      [defaultStartDate, defaultEndDate]
    );

    // Expense to Income Ratio
    const expenseIncomeRatio =
      totalIncome > 0 ? (totalExpenditure / totalIncome) * 100 : 0;

    // Payroll to Income Ratio
    const payrollIncomeRatio =
      totalIncome > 0
        ? (parseFloat(payroll[0]?.total_payroll_net || 0) / totalIncome) * 100
        : 0;

    // ==================== RESPONSE DATA ====================

    const response = {
      period: {
        start_date: defaultStartDate,
        end_date: defaultEndDate,
        period_type: period,
      },
      summary: {
        total_income: parseFloat(totalIncome.toFixed(2)),
        total_expenditure: parseFloat(totalExpenditure.toFixed(2)),
        profit_loss: parseFloat(profitLoss.toFixed(2)),
        profit_margin: parseFloat(profitMargin.toFixed(2)),
        expense_income_ratio: parseFloat(expenseIncomeRatio.toFixed(2)),
        payroll_income_ratio: parseFloat(payrollIncomeRatio.toFixed(2)),
        is_profitable: profitLoss > 0,
      },
      income: {
        fees: {
          total: parseFloat(feeIncome[0]?.total_fees_paid || 0),
          students: feeIncome[0]?.fee_paying_students || 0,
          fully_paid: feeIncome[0]?.fully_paid_students || 0,
          average: parseFloat(feeIncome[0]?.avg_fee_per_student || 0),
        },
        cash_receipts: {
          total: parseFloat(cashReceipts[0]?.total_cash_receipts || 0),
          categories: cashReceipts[0]?.receipt_categories || 0,
          details: receiptDetails,
        },
        breakdown: incomeBreakdown,
      },
      expenditure: {
        expenses: {
          total: parseFloat(expenses[0]?.total_expenses || 0),
          categories: expenses[0]?.expense_categories || 0,
          details: expenseDetails,
        },
        payroll: {
          gross_total: parseFloat(payroll[0]?.total_payroll_gross || 0),
          deductions_total: parseFloat(
            payroll[0]?.total_payroll_deductions || 0
          ),
          net_total: parseFloat(payroll[0]?.total_payroll_net || 0),
          entries: payroll[0]?.payroll_entries || 0,
          staff: payroll[0]?.staff_paid || 0,
          average_salary: parseFloat(payroll[0]?.avg_salary || 0),
          details: payrollDetails,
        },
        breakdown: expenseBreakdown,
        payroll_breakdown: payrollCategoryData,
      },
      metrics: {
        collection: {
          collected: parseFloat(collectionEfficiency[0]?.collected || 0),
          billed: parseFloat(collectionEfficiency[0]?.billed || 0),
          rate: parseFloat(collectionEfficiency[0]?.collection_rate || 0),
        },
        efficiency: {
          expense_income_ratio: parseFloat(expenseIncomeRatio.toFixed(2)),
          payroll_income_ratio: parseFloat(payrollIncomeRatio.toFixed(2)),
          profit_per_student:
            feeIncome[0]?.fee_paying_students > 0
              ? parseFloat(
                  (profitLoss / feeIncome[0]?.fee_paying_students).toFixed(2)
                )
              : 0,
          payroll_percentage:
            totalIncome > 0
              ? parseFloat(
                  (
                    ((payroll[0]?.total_payroll_net || 0) / totalIncome) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },
      },
      trends: {
        monthly: monthlyTrend.map((m) => ({
          ...m,
          month_income: parseFloat(m.month_fees) + parseFloat(m.month_cash),
          month_expenditure:
            parseFloat(m.month_expenses) + parseFloat(m.month_payroll),
          month_profit:
            parseFloat(m.month_fees) +
            parseFloat(m.month_cash) -
            (parseFloat(m.month_expenses) + parseFloat(m.month_payroll)),
        })),
      },
      generated_at: new Date().toISOString(),
    };

    if (res && typeof res.json === "function") {
      res.json(response);
      return;
    }
    return response;
  } catch (error) {
    console.error("Error fetching profit/loss data:", error);
    if (res && typeof res.status === "function") {
      res.status(500).json({
        error: "Failed to fetch profit/loss data",
        details: error.message,
      });
      return;
    }
    throw error;
  }
};

// GET /api/finance/profit-loss/export - Export P&L report
const exportProfitLossReport = async (req, res) => {
  try {
    const { format = "pdf", ...filters } = req.query;

    // Get the P&L data
    const response = await getProfitLossData({ query: filters });
    const plData = response;

    if (format === "excel") {
      await exportProfitLossExcel(plData, res);
    } else if (format === "csv") {
      await exportProfitLossCSV(plData, res);
    } else {
      await exportProfitLossPDF(plData, res);
    }
  } catch (error) {
    console.error("Error exporting P&L report:", error);
    res.status(500).json({ error: "Failed to export report" });
  }
};

// Helper: Export to Excel
const exportProfitLossExcel = async (plData, res) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summarySheet = [
    ["PROFIT & LOSS STATEMENT", "", ""],
    [
      `Period: ${plData.period.start_date} to ${plData.period.end_date}`,
      "",
      "",
    ],
    ["", "", ""],
    ["INCOME", "Amount (Ghc)", ""],
    ["Student Fees", plData.income.fees.total, ""],
    ["Other Income", plData.income.cash_receipts.total, ""],
    ["TOTAL INCOME", plData.summary.total_income, ""],
    ["", "", ""],
    ["EXPENDITURE", "Amount (Ghc)", ""],
    ["Payroll (Net)", plData.expenditure.payroll.net_total, ""],
    ["Payroll (Gross)", plData.expenditure.payroll.gross_total, ""],
    ["Payroll Deductions", plData.expenditure.payroll.deductions_total, ""],
    ["Operating Expenses", plData.expenditure.expenses.total, ""],
    ["TOTAL EXPENDITURE", plData.summary.total_expenditure, ""],
    ["", "", ""],
    ["PROFIT/LOSS", plData.summary.profit_loss, ""],
    ["Profit Margin", `${plData.summary.profit_margin}%`, ""],
    ["Expense/Income Ratio", `${plData.summary.expense_income_ratio}%`, ""],
    ["Payroll/Income Ratio", `${plData.summary.payroll_income_ratio}%`, ""],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summarySheet);
  XLSX.utils.book_append_sheet(workbook, ws1, "Summary");

  // Income Breakdown Sheet
  const incomeData = plData.income.breakdown.map((item) => [
    item.category,
    item.amount,
    item.transactions,
  ]);
  incomeData.unshift(["Category", "Amount", "Transactions"]);

  const ws2 = XLSX.utils.aoa_to_sheet(incomeData);
  XLSX.utils.book_append_sheet(workbook, ws2, "Income Breakdown");

  // Expense Breakdown Sheet
  const expenseData = plData.expenditure.breakdown.map((item) => [
    item.category,
    item.amount,
    item.transactions,
  ]);
  expenseData.unshift(["Category", "Amount", "Transactions"]);

  const ws3 = XLSX.utils.aoa_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(workbook, ws3, "Expense Breakdown");

  // Payroll Breakdown Sheet
  const payrollData = plData.expenditure.payroll_breakdown.map((item) => [
    item.category,
    item.amount,
    item.staff_count,
    item.avg_salary,
  ]);
  payrollData.unshift(["Category", "Amount", "Staff Count", "Average Salary"]);

  const ws4 = XLSX.utils.aoa_to_sheet(payrollData);
  XLSX.utils.book_append_sheet(workbook, ws4, "Payroll by Category");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="profit-loss-${plData.period.start_date}-to-${plData.period.end_date}.xlsx"`
  );
  res.send(buffer);
};

// Helper: Export to CSV
const exportProfitLossCSV = async (plData, res) => {
  // Create CSV content
  let csvContent = "Profit & Loss Statement\n";
  csvContent += `Period: ${plData.period.start_date} to ${plData.period.end_date}\n\n`;

  csvContent += "Category,Amount (Ghc),Details\n";

  // Income
  csvContent += "\nINCOME\n";
  plData.income.breakdown.forEach((item) => {
    csvContent += `${item.category},${item.amount},${item.transactions} transactions\n`;
  });

  // Expenses
  csvContent += "\nEXPENDITURE\n";
  plData.expenditure.breakdown.forEach((item) => {
    csvContent += `${item.category},${item.amount},${item.transactions} transactions\n`;
  });

  // Summary
  csvContent += "\nSUMMARY\n";
  csvContent += `Total Income,${plData.summary.total_income},\n`;
  csvContent += `Total Expenditure,${plData.summary.total_expenditure},\n`;
  csvContent += `Net Profit/Loss,${plData.summary.profit_loss},\n`;
  csvContent += `Profit Margin,${plData.summary.profit_margin}%,\n`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="profit-loss-${plData.period.start_date}-to-${plData.period.end_date}.csv"`
  );
  res.send(csvContent);
};

// Helper: Export to PDF
const exportProfitLossPDF = async (plData, res) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // School Settings
  const [schoolSettings] = await pool.query(
    "SELECT * FROM school_settings ORDER BY id DESC LIMIT 1"
  );
  const school = schoolSettings[0] || { school_name: "School Manager Academy" };

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PROFIT & LOSS STATEMENT", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(school.school_name, 20, 30);
  doc.text(
    `Period: ${plData.period.start_date} to ${plData.period.end_date}`,
    pageWidth - 20,
    30,
    { align: "right" }
  );
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    pageWidth - 20,
    35,
    { align: "right" }
  );

  // Summary Section
  let yPos = 50;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FINANCIAL SUMMARY", 20, yPos);
  yPos += 10;

  const summaryData = [
    ["Total Income", `Ghc ${plData.summary.total_income.toFixed(2)}`],
    ["Total Expenditure", `Ghc ${plData.summary.total_expenditure.toFixed(2)}`],
    ["Net Profit/Loss", `Ghc ${plData.summary.profit_loss.toFixed(2)}`],
    ["Profit Margin", `${plData.summary.profit_margin.toFixed(2)}%`],
    [
      "Payroll/Income Ratio",
      `${plData.summary.payroll_income_ratio.toFixed(2)}%`,
    ],
  ];

  summaryData.forEach(([label, value], index) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(label, 25, yPos + index * 7);

    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - 25, yPos + index * 7, { align: "right" });
  });

  yPos += summaryData.length * 7 + 15;

  // Payroll Breakdown Section
  if (plData.expenditure.payroll_breakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL BREAKDOWN BY CATEGORY", 20, yPos);
    yPos += 10;

    const payrollTable = plData.expenditure.payroll_breakdown.map((item) => [
      item.category,
      `Ghc ${parseFloat(item.amount).toFixed(2)}`,
      item.staff_count,
      `Ghc ${parseFloat(item.avg_salary || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Amount", "Staff Count", "Avg Salary"]],
      body: payrollTable,
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] }, // Amber color
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Income Breakdown
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("INCOME BREAKDOWN", 20, yPos);
  yPos += 10;

  const incomeTable = plData.income.breakdown.map((item) => [
    item.category,
    `Ghc ${parseFloat(item.amount).toFixed(2)}`,
    item.transactions,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Category", "Amount", "Transactions"]],
    body: incomeTable,
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Expense Breakdown
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EXPENDITURE BREAKDOWN", 20, yPos);
  yPos += 10;

  const expenseTable = plData.expenditure.breakdown.map((item) => [
    item.category,
    `Ghc ${parseFloat(item.amount).toFixed(2)}`,
    item.transactions,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Category", "Amount", "Transactions"]],
    body: expenseTable,
    headStyles: { fillColor: [220, 53, 69], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    margin: { left: 20, right: 20 },
  });

  // Footer
  const finalY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Confidential Financial Report", pageWidth / 2, finalY, {
    align: "center",
  });
  doc.text(
    `${school.school_name} - Generated by School Manager`,
    pageWidth / 2,
    finalY + 5,
    { align: "center" }
  );

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="profit-loss-${plData.period.start_date}-to-${plData.period.end_date}.pdf"`
  );
  res.send(pdfBuffer);
};

// GET /api/finance/profit-loss/trends - Get profit/loss trends
const getProfitLossTrends = async (req, res) => {
  try {
    const { timeframe = "6months" } = req.query;

    let months = 6;
    if (timeframe === "3months") months = 3;
    if (timeframe === "12months") months = 12;
    if (timeframe === "24months") months = 24;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const formattedStartDate = startDate.toISOString().split("T")[0];

    // Dynamic months generation
    let monthSequence = "";
    for (let i = 0; i < months; i++) {
      monthSequence += i === 0 ? i.toString() : ` UNION SELECT ${i}`;
    }

    const [trends] = await pool.query(
      `WITH months AS (
         SELECT DATE_FORMAT(DATE_ADD(?, INTERVAL seq MONTH), '%Y-%m') as month
         FROM (SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) seq
       )
       SELECT 
         m.month,
         DATE_FORMAT(STR_TO_DATE(CONCAT(m.month, '-01'), '%Y-%m-%d'), '%b %Y') as label,
         
         -- Income from fees (properly aggregated)
         COALESCE((
           SELECT SUM(stb.paid_amount) 
           FROM student_term_bills stb
           WHERE DATE_FORMAT(stb.last_payment_date, '%Y-%m') = m.month
             AND stb.is_finalized = TRUE
             AND stb.paid_amount > 0
         ), 0) as income_fees,
         
         -- Income from cash receipts
         COALESCE((
           SELECT SUM(cr.amount)
           FROM daily_cash_receipts cr
           WHERE DATE_FORMAT(cr.receipt_date, '%Y-%m') = m.month
         ), 0) as income_other,
         
         -- Operating expenses
         COALESCE((
           SELECT SUM(e.amount)
           FROM expenses e
           WHERE DATE_FORMAT(e.expense_date, '%Y-%m') = m.month
         ), 0) as expenses_operating,
         
         -- Payroll expenses
         COALESCE((
           SELECT SUM(pe.net_salary)
           FROM payroll_entries pe
           INNER JOIN payroll_periods pp ON pe.period_id = pp.id
           WHERE DATE_FORMAT(pp.start_date, '%Y-%m') = m.month
             AND pe.is_approved = TRUE
             AND pp.is_processed = TRUE
         ), 0) as expenses_payroll
         
       FROM months m
       WHERE m.month >= DATE_FORMAT(?, '%Y-%m')
       ORDER BY m.month`,
      [formattedStartDate, formattedStartDate],
    );

    // Then calculate derived columns
    const calculatedTrends = trends.map((trend) => {
      const income_fees = parseFloat(trend.income_fees) || 0;
      const income_other = parseFloat(trend.income_other) || 0;
      const expenses_operating = parseFloat(trend.expenses_operating) || 0;
      const expenses_payroll = parseFloat(trend.expenses_payroll) || 0;

      const total_income = income_fees + income_other;
      const total_expenses = expenses_operating + expenses_payroll;
      const profit_loss = total_income - total_expenses;

      return {
        ...trend,
        total_income,
        total_expenses,
        profit_loss,
      };
    });

    res.json({
      timeframe,
      months,
      start_date: formattedStartDate,
      trends: calculatedTrends,
      summary: {
        avg_monthly_income:
          trends.length > 0
            ? parseFloat(
                (
                  trends.reduce(
                    (sum, t) => sum + parseFloat(t.total_income),
                    0
                  ) / trends.length
                ).toFixed(2)
              )
            : 0,
        avg_monthly_expenses:
          trends.length > 0
            ? parseFloat(
                (
                  trends.reduce(
                    (sum, t) => sum + parseFloat(t.total_expenses),
                    0
                  ) / trends.length
                ).toFixed(2)
              )
            : 0,
        avg_monthly_profit:
          trends.length > 0
            ? parseFloat(
                (
                  trends.reduce(
                    (sum, t) => sum + parseFloat(t.profit_loss),
                    0
                  ) / trends.length
                ).toFixed(2)
              )
            : 0,
        profitable_months: trends.filter((t) => parseFloat(t.profit_loss) > 0)
          .length,
        total_months: trends.length,
      },
    });
  } catch (error) {
    console.error("Error fetching P&L trends:", error);
    res.status(500).json({
      error: "Failed to fetch trends",
      details: error.message,
    });
  }
};

module.exports = {
  getProfitLossData,
  exportProfitLossReport,
  getProfitLossTrends,
};
