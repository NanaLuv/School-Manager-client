const express = require("express");
const { uploadStudentPhoto, uploadLogo } = require("../middleware/upload");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const {
  createNewSubject,
  getSubjects,
  updateSubjects,
  deleteSubject,
  getTeachers,
  createTeacher,
  updateTeachers,
  deleteTeacher,
  getAcademicYears,
  createAcademicYear,
  getTerms,
  getTermsByAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  createTerm,
  updateTerm,
  deleteTerm,
  setCurrentYear,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassTeachers,
  getClassTeacherById,
  assignClassTeacher,
  updateClassTeacher,
  deleteClassTeacher,
  getAvailableTeachers,
  getSubjectAssignments,
  createSubjectAssignment,
  updateSubjectAssignment,
  deleteSubjectAssignment,
  getAcademicYearsForSujectAssignment,
  getClassAssignments,
  createClassAssignment,
  createBulkClassAssignments,
  updateClassAssignment,
  promoteStudent,
  deleteClassAssignment,
  getStudents,
  createStudent,
  updateStudent,
  deactivateStudent,
  activateStudent,
  importStudents,
  exportStudents,
  getClassWithStudents,
  exportClassStudents,
  getGradingScales,
  getGradingScaleById,
  createGradingScale,
  updateGradingScale,
  deleteGradingScale,
  calculateGrade,
  createBulkGrades,
  getClassSubjects,
  getGrades,
  exportGradeTemplate,
  importGrades,
  getReportCards,
  getReportCardById,
  generateReportCards,
  updateReportCard,
  generateStudentReportCardPDF,
  generateClassReportCardsPDF,
  getStudentsForAttendance,
  markAttendance,
  markBulkAttendance,
  getAttendanceRecords,
  getAcademicYearsPaginated,
  getAttendanceStatistics,
  getAttendanceReports,
  exportAttendanceReport,
  getFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  getBillTemplates,
  createBillTemplate,
  updateBillTemplate,
  deleteBillTemplate,
  getStudentBills,
  generateBillsFromTemplates,
  saveStudentTermBill,
  getStudentTermBill,
  checkStudentPayments,
  getStudentArrears,
  addStudentArrear,
  deleteStudentArrear,
  getStudentOverpayments,
  addStudentOverpayment,
  deleteStudentOverpayment,
  generateClassBillsPDF,
  processPayment,
  getUsers,
  getPaymentHistory,
  getPaymentAllocations,
  generateReceiptPDF,
  getAllReceipts,
  getPaymentsByCategory,
  getStudentStatements,
  getClassCollections,
  exportFinancialData,
  recordCashReceipt,
  getCashReceipts,
  getCashReceiptsSummary,
  getCashReceiptsStats,
  exportCashReceipts,
  deleteCashReceipt,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStatistics,
  getExpenseCategories,
  exportExpenses,
  getSchoolSettings,
  updateSchoolSettings,
  getSchoolSettingsForPDF,
  getAvailableBillsForStudent,
  addBillsToFinalizedTerm,
  getStudentsByClass,
  getStudentsWithPreviousBalances,
  getCacheStats,
  clearCache,
  getIndividualReportCardPDF,
  // deleteAllArrears,
  // deleteAllOverpayments,
  getDashboardStats,
  getClassesPaginated,
  sendBalanceReminder,
  getEmailStats,
  getEmailLogs,
  sendBulkBalanceReminders,
} = require("../controller/control");

const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  getRoles,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  loginUser,
  changePasswordWithDefault,
  setDefaultPassword,
  getUserActivityLogs,
  getUserActivityStats,
  exportActivityLogs,
} = require("../controller/authController");

const {
  getStaff,
  addStaff,
  getPayrollPeriods,
  createPayrollPeriod,
  calculatePayroll,
  approvePayrollEntry,
  processPayrollPeriod,
  generatePayrollReport,
  generatePayslipPDF,
  getPayrollEntries,
  savePayrollEntry,
  getPreviousPayrollEntry,
  copyEntriesFromPreviousPeriod,
  getPayrollEntryById,
  updatePayrollEntry,
  deletePayrollEntry,
  deletePayrollPeriod,
  approvePayrollEntriesBulk,
  getStaffCategories,
  bulkImportStaff,
  createStaffCategory,
} = require("../controller/payrollController");

const {
  getProfitLossData,
  exportProfitLossReport,
  getProfitLossTrends,
} = require("../controller/profitAndLossController");
const {
  loginLimiter,
  failedLoginLimiter,
  getRateLimitStatus,
} = require("../middleware/rateLimiter");

router.post("/login", loginLimiter, failedLoginLimiter, loginUser);
router.get("/login-status", getRateLimitStatus);

router.use(authenticateToken);

//get users
router.get("/getusers", getUsers);

//get all subjects
router.get("/getsubjects", authorizeRoles(1, 2), getSubjects);

// create new subject
router.post("/createnewsubject", authorizeRoles(1, 2), createNewSubject);

//update subject
router.put("/updatesubject/:id", authorizeRoles(1, 2), updateSubjects);

//delete subject
router.delete("/deletesubject/:id", authorizeRoles(1), deleteSubject);

//get teachers
router.get("/getteachers", authorizeRoles(1, 2), getTeachers);

//create teachers
router.post("/createteacher", authorizeRoles(1), createTeacher);

//update teachers
router.put("/updateteacher/:id", authorizeRoles(1), updateTeachers);

//delete teacher
router.delete("/deleteteacher/:id", authorizeRoles(1), deleteTeacher);

//get academic year
router.get("/getacademicyears", getAcademicYears);

//get academic years paginated
router.get("/getacademicyearspaginated", getAcademicYearsPaginated);

//create academic year
router.post("/createacademicyear", authorizeRoles(1), createAcademicYear);
router.put("/updateacademicyear/:id", authorizeRoles(1), updateAcademicYear);
router.put("/setcurrentyear/:id", authorizeRoles(1), setCurrentYear);
router.delete("/deleteacademicyear/:id", authorizeRoles(1), deleteAcademicYear);

//get terms
router.get("/getterms", getTerms);

//get terms by academic year
router.get(
  "/terms/by-academic-year",
  authorizeRoles(1, 2, 4),
  getTermsByAcademicYear,
);

//create terms
router.post("/createterm", authorizeRoles(1), createTerm);
router.put("/updateTerm/:id", authorizeRoles(1, 4), updateTerm);
router.delete("/deleteTerm/:id", authorizeRoles(1), deleteTerm);

//get classes
router.get("/getclasses", authorizeRoles(1, 2, 4), getClasses);
router.get("/getclassespaginated", getClassesPaginated);

//create class
router.post("/createclass", authorizeRoles(1), createClass);
router.put("/updateclass/:id", authorizeRoles(1), updateClass);
router.delete("/deleteclass/:id", authorizeRoles(1), deleteClass);
router.get(
  "/getclasses/:id/students",
  authorizeRoles(1, 2),
  getClassWithStudents,
);

//get class with students
router.get(
  "/getclasses/:id/export-students",
  authorizeRoles(1),
  exportClassStudents,
);

// class teacher routes
router.get("/getclassteachers", getClassTeachers);
router.get("/getclassteachers/:id", getClassTeacherById);
router.post("/assignclassteacher", assignClassTeacher);
router.put("/updateclassteacher/:id", updateClassTeacher);
router.delete("/deleteclassteacher/:id", deleteClassTeacher);
router.get("/getavailableteachers", getAvailableTeachers);

//get subject assignments
router.get("/getsubjectassignments", getSubjectAssignments);

//create subject assignment
router.post("/createsubjectassignment", createSubjectAssignment);

//update subject assignment
router.put("/updatesubjectassignment/:id", updateSubjectAssignment);

//delete subject assignment
router.delete("/deletesubjectassignment/:id", deleteSubjectAssignment);

//get academic years for subjec assignment
router.get(
  "/getacademicyearsforsubjectassignment",
  getAcademicYearsForSujectAssignment,
);

// Class Assignments Routes
router.get("/getclassassignments", getClassAssignments);
router.post("/createclassassignment", createClassAssignment);
router.post("/createclassassignment-bulk", createBulkClassAssignments);
router.put("/updateclassassignment/:id", updateClassAssignment);
router.put("/promotestudent/:id", promoteStudent);
router.delete("/deleteclassassignment/:id", deleteClassAssignment);

// Students routes
router.get("/getstudents", authorizeRoles(1, 2, 4), getStudents);
router.put("/deactivatestudent/:id", authorizeRoles(1), deactivateStudent);
router.put("/activatestudent/:id", authorizeRoles(1), activateStudent);
router.post("/importstudents", authorizeRoles(1), importStudents);
router.get("/exportstudents", authorizeRoles(1), exportStudents);
router.post(
  "/createstudent",
  authorizeRoles(1),
  uploadStudentPhoto.single("photo"),
  createStudent,
);
router.put(
  "/updatestudent/:id",
  authorizeRoles(1),
  uploadStudentPhoto.single("photo"),
  updateStudent,
);

router.get("/getgradingscales", getGradingScales);
router.get("/getgradingscales/:id", getGradingScaleById);
router.post("/creategradingscale", authorizeRoles(1, 2), createGradingScale);
router.put("/updategradingscale/:id", authorizeRoles(1, 2), updateGradingScale);
router.delete("/deletegradingscale/:id", authorizeRoles(1), deleteGradingScale);
router.get("/calculategrade/:score", calculateGrade);

// Grade management routes
// Bulk operations
router.post("/createbulkgrades", authorizeRoles(1, 2), createBulkGrades);
router.get("/getclasssubjects/:classId/:academicYearId", getClassSubjects);
router.get("/getgrades", authorizeRoles(1, 2, 3), getGrades);
router.get(
  "/exportgradetemplate",
  authorizeRoles(1, 2, 3),
  exportGradeTemplate,
);
router.post(
  "/importgrades",
  authorizeRoles(1, 2),
  upload.single("file"),
  importGrades,
);

router.get("/getreportcards", authorizeRoles(1, 2, 3), getReportCards);
router.get("/getreportcard/:id", getReportCardById);
router.get(
  "/getindividualreportcardpdf/:report_card_id",
  getIndividualReportCardPDF,
);
router.post("/generatereportcards", generateReportCards);
router.put("/updatereportcard/:id", updateReportCard);
router.get(
  "/generatestudentreportcardpdf/:report_card_id",
  generateStudentReportCardPDF,
);
router.get(
  "/generateclassreportcardspdf/:class_id/:academic_year_id/:term_id",
  generateClassReportCardsPDF,
);

// Attendance routes
router.get("/attendance/class/:class_id", getStudentsForAttendance);
router.post("/attendance/mark", authorizeRoles(1, 2), markAttendance);
router.post("/attendance/bulk", authorizeRoles(1, 2), markBulkAttendance);
router.get("/attendance/records", getAttendanceRecords);
router.get("/attendance/statistics", getAttendanceStatistics);
router.get("/attendance/reports", getAttendanceReports);
router.get("/attendance/export", authorizeRoles(1), exportAttendanceReport);
//fee category routes
router.get("/getfeecategories", authorizeRoles(1, 2, 4), getFeeCategories);
router.post("/createfeecategory", authorizeRoles(1), createFeeCategory);
router.put("/updatefeecategory/:id", authorizeRoles(1), updateFeeCategory);
router.delete("/deletefeecategory/:id", authorizeRoles(1), deleteFeeCategory);

//bill template routes
router.get("/getbilltemplates", authorizeRoles(1, 2, 4), getBillTemplates);
router.post("/createbilltemplate", authorizeRoles(1, 4), createBillTemplate);
router.put("/updatebilltemplate/:id", authorizeRoles(1, 4), updateBillTemplate);
router.delete(
  "/deletebilltemplate/:id",
  authorizeRoles(1, 4),
  deleteBillTemplate,
);

//student bill routes
router.get("/getstudentbills", authorizeRoles(1, 2, 4), getStudentBills);
router.get("/students-with-previous-balances", getStudentsWithPreviousBalances);
router.post(
  "/generatebillsfromtemplates",
  authorizeRoles(1, 4),
  generateBillsFromTemplates,
);
router.post("/savestudenttermbill", saveStudentTermBill);
router.get("/getstudenttermbill/:studentId", getStudentTermBill);
router.get("/checkstudentpayments/:studentId", checkStudentPayments);
router.post("/add-bills-to-finalized", addBillsToFinalizedTerm);
router.get("/get-available-bills", getAvailableBillsForStudent);
router.get(
  "/class-bills-pdf/:class_id/:academic_year_id/:term_id",
  generateClassBillsPDF,
);
//student arrears routes
// Arrears routes
router.get("/getstudentarrears/:studentId", getStudentArrears);
router.post("/addstudentarrear", addStudentArrear);
router.delete("/deletestudentarrear/:id", deleteStudentArrear);
// router.delete("/student-arrears", deleteAllArrears);

//student overpayments routes
router.get("/getstudentoverpayments/:studentId", getStudentOverpayments);
router.post("/addstudentoverpayment", addStudentOverpayment);
router.delete("/deletestudentoverpayment/:id", deleteStudentOverpayment);
// router.delete("/student-overpayments", deleteAllOverpayments);

// Process payment route
router.get("/getstudentsbyclass", getStudentsByClass);
router.post("/processpayment", processPayment);
router.get(
  "/getpaymenthistory/:studentId",
  authorizeRoles(1, 2, 4),
  getPaymentHistory,
);
router.get("/getpaymentallocations/:paymentId", getPaymentAllocations);

// Receipt routes
router.get("/receipts/:receipt_number", generateReceiptPDF);
router.get("/getallreceipts", authorizeRoles(1, 2, 4), getAllReceipts);

//financial records

// Add to your routes
router.get("/financial-records/payments-by-category", getPaymentsByCategory);
router.get("/financial-records/student-statements", getStudentStatements);
router.get("/financial-records/class-collections", getClassCollections);
router.post("/financial-records/export", exportFinancialData);

// Daily Cash Receipts Routes
router.post("/cash-receipts", authorizeRoles(1, 4), recordCashReceipt);
router.get("/cash-receipts", authorizeRoles(1, 2, 4), getCashReceipts);
router.get("/cash-receipts/summary", getCashReceiptsSummary);
router.get("/cash-receipts/stats", getCashReceiptsStats);
router.get("/cash-receipts/export", exportCashReceipts);
router.delete("/cash-receipts/:id", authorizeRoles(1, 4), deleteCashReceipt);

// Expenses Management Routes

router.get("/expenses", authorizeRoles(1, 2, 4), getExpenses);
router.get("/expenses/statistics", getExpenseStatistics);
router.get("/expenses/categories", getExpenseCategories);
router.get("/expenses/export", exportExpenses);
router.post("/expenses", authorizeRoles(1, 4), createExpense);
router.get("/expenses/:id", getExpenseById);
router.put("/expenses/:id", authorizeRoles(1, 4), updateExpense);
router.delete("/expenses/:id", authorizeRoles(1, 4), deleteExpense);

// School Settings Routes
router.get("/school-settings", getSchoolSettings);
router.post(
  "/school-settings",
  authorizeRoles(1),
  uploadLogo.single("school_logo"),
  updateSchoolSettings,
);
router.get("/school-settings/pdf", getSchoolSettingsForPDF);

router.get("/cache/stats", getCacheStats);
router.delete("/cache/clear", clearCache);

router.get("/dashboard/stats", authorizeRoles(1, 2, 4), getDashboardStats);

//auth routes will be here
router.get("/getroles", getRoles);
router.post("/createuser", authorizeRoles(1), createUser);
router.put("/updateuser/:id", authorizeRoles(1), updateUser);
router.delete("/deleteuser/:id", authorizeRoles(1), deleteUser);
router.post("/changepassword", changeUserPassword);
router.post("/login", loginUser);
router.post(
  "/changepasswordwithdefault",
  authorizeRoles(1),
  changePasswordWithDefault,
);
router.post("/setdefaultpassword", authorizeRoles(1), setDefaultPassword);

router.get(
  "/user-activity-logs",
  authenticateToken,
  authorizeRoles(1),
  getUserActivityLogs,
);
router.get(
  "/user-activity-logs/stats",
  authenticateToken,
  authorizeRoles(1),
  getUserActivityStats,
);
router.get(
  "/user-activity-logs/export",
  authenticateToken,
  authorizeRoles(1),
  exportActivityLogs,
);

//payroll routes
router.get("/payroll/getstaff", authorizeRoles(1, 4), getStaff);
router.post("/payroll/addstaff", authorizeRoles(1, 4), addStaff);
router.get(
  "/payroll/getpayrollperiods",
  authorizeRoles(1, 4),
  getPayrollPeriods,
);
router.post(
  "/payroll/addpayrollperiods",
  authorizeRoles(1, 4),
  createPayrollPeriod,
);
router.get("/payroll/entries/:period_id", getPayrollEntries);
router.post("/payroll/calculate", authorizeRoles(1, 4), calculatePayroll);
router.post("/payroll/save-entry", authorizeRoles(1, 4), savePayrollEntry);
router.put("/payroll/approve/:id", authorizeRoles(1, 4), approvePayrollEntry);
router.post(
  "/payroll/process/:period_id",
  authorizeRoles(1, 4),
  processPayrollPeriod,
);
router.get(
  "/payroll/report/:period_id",
  authorizeRoles(1, 4),
  generatePayrollReport,
);
router.get("/payroll/payslip/:id", authorizeRoles(1, 4), generatePayslipPDF);
router.get("/payroll/previous-entry/:staff_id", getPreviousPayrollEntry);
router.post("/payroll/copy-previous/:period_id", copyEntriesFromPreviousPeriod);
router.get("/payroll/entry/:id", getPayrollEntryById);
router.put("/payroll/update-entry/:id", updatePayrollEntry);
router.delete("/payroll/delete-entry/:id", deletePayrollEntry);
router.delete("/payroll/periods/:id", deletePayrollPeriod);
router.post("/payroll/approve-bulk", approvePayrollEntriesBulk);
router.get("/payroll/categories", getStaffCategories);
router.post("/payroll/categories", createStaffCategory);
router.post("/payroll/bulk-import", bulkImportStaff);

// Profit & Loss Routes
router.get("/finance/profit-loss", getProfitLossData);
router.get("/finance/profit-loss/export", exportProfitLossReport);
router.get("/finance/profit-loss/trends", getProfitLossTrends);

// Send balance reminder
router.post("/send-balance-reminder", sendBalanceReminder);
router.post("/send-bulk-reminders", sendBulkBalanceReminders);

router.get("/email-logs", getEmailLogs);
router.get("/email-stats", getEmailStats);

module.exports = router;
