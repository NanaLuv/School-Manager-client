// export default FinancialRecords;
import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAcademicData } from "../../hooks/useAcademicContext";
import api from "../../components/axiosconfig/axiosConfig";
import BulkReminderModal from "../../components/finance/BulkReminderModal";

const FinancialRecords = () => {
  // Use the academic context hook
  const {
    academicYears,
    terms,
    selectedAcademicYear,
    selectedTerm,
    handleAcademicYearChange,
    handleTermChange,
    loading: academicLoading,
    getSelectedAcademicYear,
    getSelectedTerm,
  } = useAcademicData();

  // Tab state
  const [activeTab, setActiveTab] = useState("payments-by-category");

  // State for Payments by Category (using hook's default selections)
  const [paymentsFilters, setPaymentsFilters] = useState({
    fee_category_id: "",
    academic_year_id: selectedAcademicYear || "",
    term_id: selectedTerm || "",
    start_date: "",
    end_date: "",
    class_id: "",
    payment_method: "",
  });

  // State for Student Statements
  const [statementsFilters, setStatementsFilters] = useState({
    student_id: "",
    student_name: "",
    admission_number: "",
    class_id: "",
    academic_year_id: selectedAcademicYear || "",
    term_id: selectedTerm || "",
    status: "",
  });

  // State for Class Collections
  const [collectionsFilters, setCollectionsFilters] = useState({
    academic_year_id: selectedAcademicYear || "",
    term_id: selectedTerm || "",
    start_date: "",
    end_date: "",
  });

  // State for data
  const [payments, setPayments] = useState([]);
  const [paymentsSummary, setPaymentsSummary] = useState({});
  const [paymentsPagination, setPaymentsPagination] = useState({});

  const [students, setStudents] = useState([]);
  const [studentsSummary, setStudentsSummary] = useState({});
  const [studentsPagination, setStudentsPagination] = useState({});

  const [classCollections, setClassCollections] = useState([]);
  const [collectionsSummary, setCollectionsSummary] = useState({});

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeAllData: false,
    includeSummary: true,
    format: "excel",
  });

  const [loading, setLoading] = useState(false);

  // State for dropdown options
  const [feeCategories, setFeeCategories] = useState([]);
  const [classes, setClasses] = useState([]);

  // Add to your state declarations
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showBulkReminder, setShowBulkReminder] = useState(false);

  // Payment methods
  const paymentMethods = [
    { value: "", label: "All Methods" },
    { value: "Cash", label: "Cash" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "Mobile Money", label: "Mobile Money" },
    { value: "Check", label: "Check" },
    { value: "Card", label: "Card" },
  ];

  // Student status options
  const studentStatusOptions = [
    { value: "", label: "All Students" },
    { value: "owing", label: "Students Owing" },
    { value: "fully_paid", label: "Fully Paid" },
    { value: "pending", label: "Pending Bills" },
  ];

  // Load dropdown options
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Sync filters with academic context when they change
  useEffect(() => {
    if (selectedAcademicYear) {
      setPaymentsFilters((prev) => ({
        ...prev,
        academic_year_id: selectedAcademicYear,
      }));
      setStatementsFilters((prev) => ({
        ...prev,
        academic_year_id: selectedAcademicYear,
      }));
      setCollectionsFilters((prev) => ({
        ...prev,
        academic_year_id: selectedAcademicYear,
      }));
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedTerm) {
      setPaymentsFilters((prev) => ({ ...prev, term_id: selectedTerm }));
      setStatementsFilters((prev) => ({ ...prev, term_id: selectedTerm }));
      setCollectionsFilters((prev) => ({ ...prev, term_id: selectedTerm }));
    }
  }, [selectedTerm]);

  const fetchDropdownData = async () => {
    try {
      const [categoriesRes, classesRes] = await Promise.all([
        api.get("/getfeecategories"),
        api.get("/getclasses"),
      ]);

      setFeeCategories(categoriesRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
      alert("Error loading filter options");
    }
  };

  // Fetch data based on active tab
  const fetchData = async (page = 1) => {
    if (academicLoading) {
      return;
    }

    setLoading(true);
    try {
      switch (activeTab) {
        case "payments-by-category":
          await fetchPaymentsByCategory(page);
          break;
        case "student-statements":
          await fetchStudentStatements(page);
          break;
        case "class-collections":
          await fetchClassCollections();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`Error loading ${activeTab.replace("-", " ")}`);
    }
    setLoading(false);
  };

  const fetchPaymentsByCategory = async (page = 1) => {
    const params = new URLSearchParams({
      ...paymentsFilters,
      page: page.toString(),
      limit: "50",
    });

    const response = await api.get(
      `/financial-records/payments-by-category?${params}`,
    );

    setPayments(response.data.payments);
    setPaymentsSummary(response.data.summary);
    setPaymentsPagination(response.data.pagination);
  };

  const fetchStudentStatements = async (page = 1) => {
    const params = new URLSearchParams({
      ...statementsFilters,
      page: page.toString(),
      limit: "50",
    });

    const response = await api.get(
      `/financial-records/student-statements?${params}`,
    );

    setStudents(response.data.students);
    console.log("fetched students:", response.data.students);
    setStudentsSummary(response.data.summary);
    setStudentsPagination(response.data.pagination);
  };

  const fetchClassCollections = async () => {
    const params = new URLSearchParams(collectionsFilters);

    const response = await api.get(
      `/financial-records/class-collections?${params}`,
    );

    setClassCollections(response.data.classCollections);
    setCollectionsSummary(response.data.total_summary);
  };

  // Handle filter changes for each tab
  const handlePaymentsFilterChange = (key, value) => {
    setPaymentsFilters((prev) => ({ ...prev, [key]: value }));

    // Update academic context if year or term changes
    if (key === "academic_year_id" && value) {
      handleAcademicYearChange(value);
    } else if (key === "term_id" && value) {
      handleTermChange(value);
    }
  };

  const handleStatementsFilterChange = (key, value) => {
    setStatementsFilters((prev) => ({ ...prev, [key]: value }));

    // Update academic context if year or term changes
    if (key === "academic_year_id" && value) {
      handleAcademicYearChange(value);
    } else if (key === "term_id" && value) {
      handleTermChange(value);
    }
  };

  const handleCollectionsFilterChange = (key, value) => {
    setCollectionsFilters((prev) => ({ ...prev, [key]: value }));

    // Update academic context if year or term changes
    if (key === "academic_year_id" && value) {
      handleAcademicYearChange(value);
    } else if (key === "term_id" && value) {
      handleTermChange(value);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(1);
  };

  // Handle reset for each tab
  const handleReset = () => {
    switch (activeTab) {
      case "payments-by-category":
        setPaymentsFilters({
          fee_category_id: "",
          academic_year_id: selectedAcademicYear || "",
          term_id: selectedTerm || "",
          start_date: "",
          end_date: "",
          class_id: "",
          payment_method: "",
        });
        setPayments([]);
        setPaymentsSummary({});
        break;
      case "student-statements":
        setStatementsFilters({
          student_id: "",
          admission_number: "",
          class_id: "",
          academic_year_id: selectedAcademicYear || "",
          term_id: selectedTerm || "",
          status: "",
          student_name: "",
        });
        setStudents([]);
        setStudentsSummary({});
        break;
      case "class-collections":
        setCollectionsFilters({
          academic_year_id: selectedAcademicYear || "",
          term_id: selectedTerm || "",
          start_date: "",
          end_date: "",
        });
        setClassCollections([]);
        setCollectionsSummary({});
        break;
      default:
        break;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Get status badge color
  const getStatusBadge = (balance, isFinalized) => {
    if (!isFinalized) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="w-3 h-3 mr-1" /> Pending
        </span>
      );
    }

    if (balance > 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationCircleIcon className="w-3 h-3 mr-1" /> Owing:{" "}
          {formatCurrency(balance)}
        </span>
      );
    } else if (balance <= 0 && balance !== null) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" /> Paid
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Bill
        </span>
      );
    }
  };

  // Tabs configuration
  const tabs = [
    {
      id: "payments-by-category",
      name: "Payments by Category",
      icon: DocumentChartBarIcon,
      description: "View payments made to specific fee categories",
    },
    {
      id: "student-statements",
      name: "Student Statements",
      icon: UserGroupIcon,
      description: "View student financial statements and status",
    },
    {
      id: "class-collections",
      name: "Class Collections",
      icon: AcademicCapIcon,
      description: "Class-wise fee collection summary",
    },
  ];

  const handleExport = async (format = "excel") => {
    try {
      let exportData = {
        exportType: activeTab,
        filters: {},
        format: format,
      };

      // Set filters based on active tab
      switch (activeTab) {
        case "payments-by-category":
          exportData.filters = paymentsFilters;
          break;
        case "student-statements":
          exportData.filters = statementsFilters;
          break;
        case "class-collections":
          exportData.filters = collectionsFilters;
          break;
        default:
          break;
      }

      // Show loading
      setLoading(true);

      // Make API call to export
      const response = await api.post("/financial-records/export", exportData, {
        responseType: "blob",
        timeout: 60000,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Set filename
      let filename = "";
      const dateStr = new Date().toISOString().split("T")[0];

      switch (format) {
        case "pdf":
          filename = `${activeTab.replace("-", "_")}-${dateStr}.pdf`;
          break;
        default:
          filename = `${activeTab.replace("-", "_")}-${dateStr}.xlsx`;
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      if (error.code === "ECONNABORTED") {
        alert(
          "Export timed out. Please try again with less data or use Excel format.",
        );
      } else {
        alert("Error exporting data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportWithFilters = async (customFilters) => {
    try {
      const exportData = {
        exportType: activeTab,
        filters: customFilters,
        columns: [],
      };

      setLoading(true);

      const response = await api.post("/financial-records/export", exportData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      let filename = "";
      if (Object.keys(customFilters).length === 0) {
        filename = `all-${activeTab.replace("-", "_")}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
      } else {
        filename = `${activeTab.replace("-", "_")}-${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Error exporting data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch payment details for a student
  const fetchStudentPaymentDetails = async (
    studentId,
    academicYearId,
    termId,
  ) => {
    setLoadingPayments(true);
    try {
      const response = await api.get(`/getpaymenthistory/${studentId}`, {
        params: {
          academic_year_id: academicYearId || selectedAcademicYear,
          term_id: termId || selectedTerm,
        },
      });

      // Handle different response structures
      if (Array.isArray(response.data)) {
        setPaymentDetails(response.data);
      } else if (response.data && response.data.payments) {
        setPaymentDetails(response.data.payments);
      } else if (response.data && response.data.data) {
        setPaymentDetails(response.data.data);
      } else {
        console.log("Unexpected response structure:", response.data);
        setPaymentDetails([]);
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      setPaymentDetails([]);
      alert("Unable to load payment details at this time. Please try again.");
    }
    setLoadingPayments(false);
  };

  // Function to handle student row click
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);

    // Use current academic year and term from the hook
    const academicYearId = selectedAcademicYear;
    const termId = selectedTerm;

    await fetchStudentPaymentDetails(
      student.student_id,
      academicYearId,
      termId,
    );
    setShowPaymentModal(true);
  };

  // Helper function for status text
  const getStatusText = (balance, isFinalized) => {
    if (!isFinalized) return "Pending";
    if (balance > 0) return "Owing";
    if (balance <= 0 && balance !== null) return "Paid";
    return "No Bill";
  };

  // Academic information display
  const getSelectedYearLabel = () => {
    const year = getSelectedAcademicYear();
    return year
      ? `${year.year_label} ${year.is_current ? "(Current)" : ""}`
      : "Select Year";
  };

  const getSelectedTermLabel = () => {
    const term = getSelectedTerm();
    return term ? term.term_name : "Select Term";
  };

  //send reminder function
  const sendReminder = async (student, e) => {
    console.log("Sending reminder for student:", student);
    e.stopPropagation(); // Prevent row click when clicking button

    if (!student.parent_email) {
      toast?.error("No email address found for this student") ||
        alert(
          "No email address found for this student. Please add parent email first.",
        );
      return;
    }

    if (student.remaining_balance <= 0) {
      toast?.info("Student has no outstanding balance") ||
        alert("Student has no outstanding balance");
      return;
    }

    if (
      !window.confirm(
        `Send balance reminder to ${student.parent_name || "parent"} for ${student.first_name} ${student.last_name}?`,
      )
    ) {
      return;
    }

    setSendingReminder(student.student_id);

    try {
      const response = await api.post("/send-balance-reminder", {
        student_id: student.student_id,
        academic_year_id: selectedAcademicYear,
        term_id: selectedTerm,
      });
      console.log("Reminder response:", response.data);
      if (response.data.success) {
        setNotification({
          type: "success",
          message: "Reminder sent successfully!",
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      const errorMsg = error.response?.data?.error || "Failed to send reminder";
      toast?.error(errorMsg) || alert(errorMsg);
    } finally {
      setSendingReminder(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      {/* Header with academic info */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BanknotesIcon className="w-6 h-6 mr-2 text-blue-500" />
              Financial Records Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive financial tracking and reporting
            </p>
          </div>

          {/* Academic Context Display */}
          <div className="bg-white border rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Academic Context</div>
            <div className="flex items-center space-x-4">
              <div>
                <span className="font-medium">Year:</span>{" "}
                {getSelectedYearLabel()}
              </div>
              <div>
                <span className="font-medium">Term:</span>{" "}
                {getSelectedTermLabel()}
              </div>
              {academicLoading && (
                <div className="text-xs text-blue-600 animate-pulse">
                  Loading academic data...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setTimeout(() => fetchData(1), 100);
              }}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm flex items-center
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Description */}
      <div className="mb-6">
        <p className="text-gray-700">
          {tabs.find((t) => t.id === activeTab)?.description}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MagnifyingGlassIcon className="w-5 h-5 mr-2 text-gray-500" />
          Filter {tabs.find((t) => t.id === activeTab)?.name}
        </h2>

        {/* Academic Year and Term Selectors - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b">
          <div>
            <label className="block text-sm font-medium mb-1">
              Academic Year *
            </label>
            <select
              value={selectedAcademicYear || ""}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label} {year.is_current && "(Current)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Term *</label>
            <select
              value={selectedTerm || ""}
              onChange={(e) => handleTermChange(e.target.value)}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              required
              disabled={!selectedAcademicYear || academicLoading}
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.term_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payments by Category Filters */}
        {activeTab === "payments-by-category" && (
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Fee Category *
              </label>
              <select
                value={paymentsFilters.fee_category_id}
                onChange={(e) =>
                  handlePaymentsFilterChange("fee_category_id", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Fee Category</option>
                {feeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={paymentsFilters.start_date}
                onChange={(e) =>
                  handlePaymentsFilterChange("start_date", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={paymentsFilters.end_date}
                onChange={(e) =>
                  handlePaymentsFilterChange("end_date", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                value={paymentsFilters.class_id}
                onChange={(e) =>
                  handlePaymentsFilterChange("class_id", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Method
              </label>
              <select
                value={paymentsFilters.payment_method}
                onChange={(e) =>
                  handlePaymentsFilterChange("payment_method", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Search
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </form>
        )}

        {/* Student Statements Filters */}
        {activeTab === "student-statements" && (
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={statementsFilters.student_name}
                onChange={(e) =>
                  handleStatementsFilterChange("student_name", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Search by student name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Admission Number
              </label>
              <input
                type="text"
                value={statementsFilters.admission_number}
                onChange={(e) =>
                  handleStatementsFilterChange(
                    "admission_number",
                    e.target.value,
                  )
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Search by admission number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <select
                value={statementsFilters.class_id}
                onChange={(e) =>
                  handleStatementsFilterChange("class_id", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={statementsFilters.status}
                onChange={(e) =>
                  handleStatementsFilterChange("status", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              >
                {studentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Search
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </form>
        )}

        {/* Class Collections Filters */}
        {activeTab === "class-collections" && (
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={collectionsFilters.start_date}
                onChange={(e) =>
                  handleCollectionsFilterChange("start_date", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={collectionsFilters.end_date}
                onChange={(e) =>
                  handleCollectionsFilterChange("end_date", e.target.value)
                }
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center"
              >
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Search
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Summary Cards - Dynamic based on active tab */}
      {activeTab === "payments-by-category" &&
        paymentsSummary.total_amount > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <BanknotesIcon className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Collected</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(paymentsSummary.total_amount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <DocumentChartBarIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-xl font-bold text-gray-900">
                    {paymentsSummary.total_payments || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <AcademicCapIcon className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Students Paid</p>
                  <p className="text-xl font-bold text-gray-900">
                    {paymentsSummary.total_students || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Average Payment</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(paymentsSummary.average_payment)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {activeTab === "student-statements" &&
        studentsSummary.total_students > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-xl font-bold text-gray-900">
                    {studentsSummary.total_students || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Students Owing</p>
                  <p className="text-xl font-bold text-gray-900">
                    {studentsSummary.total_owing || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Fully Paid</p>
                  <p className="text-xl font-bold text-gray-900">
                    {studentsSummary.total_paid || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Pending Bills</p>
                  <p className="text-xl font-bold text-gray-900">
                    {studentsSummary.total_pending || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {activeTab === "class-collections" &&
        collectionsSummary.total_classes > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <AcademicCapIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-xl font-bold text-gray-900">
                    {collectionsSummary.total_classes || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <BanknotesIcon className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Collected</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(collectionsSummary.total_collected)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-xl font-bold text-gray-900">
                    {collectionsSummary.total_students || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center">
                <DocumentChartBarIcon className="w-8 h-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-xl font-bold text-gray-900">
                    {collectionsSummary.total_payments || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Results Section */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {activeTab === "payments-by-category" && "Payment Records"}
            {activeTab === "student-statements" && "Student Statements"}
            {activeTab === "class-collections" && "Class Collections"}

            {activeTab === "payments-by-category" && payments.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                ({payments.length} records found)
              </span>
            )}
            {activeTab === "student-statements" && students.length > 0 && (
              <span className="text-sm text-gray-500 ml-2">
                ({students.length} students found)
              </span>
            )}
            {activeTab === "class-collections" &&
              classCollections.length > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  ({classCollections.length} classes found)
                </span>
              )}
          </h2>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport("excel")}
              className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              title="Export to Excel"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 2v6h6l-6-6z" />
              </svg>
              Excel
            </button>

            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              title="Export to PDF"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396 0-.705-.373-1.268-1.255-1.268z" />
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-3.666 9.293c0-.757.268-1.304.785-1.643.511-.334 1.24-.514 2.186-.514.949 0 1.683.18 2.201.537.517.357.778.92.778 1.692v3.861h-1.496v-1.02h-.05c-.163.377-.419.669-.767.876-.348.205-.804.308-1.368.308-.644 0-1.148-.152-1.513-.456-.365-.305-.548-.76-.548-1.363 0-.628.192-1.092.577-1.392.385-.3.935-.449 1.649-.449.457 0 .846.061 1.169.184.322.123.569.277.738.462h.05v-1.23h.033c-.012-.213-.081-.405-.207-.574a1.19 1.19 0 00-.524-.396 2.157 2.157 0 00-.801-.137c-.57 0-1.024.153-1.362.46-.339.307-.508.75-.508 1.33h1.503zm4.988 2.963v1.15h-3.595v-1.15h3.595zM14 9h-1V4l5 5h-4z" />
              </svg>
              PDF
            </button>
          </div>

          {/* Export Button */}
          {/* Export Button with options */}
          {(payments.length > 0 ||
            students.length > 0 ||
            classCollections.length > 0) && (
            <div className="relative group">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text={`Loading ${activeTab.replace("-", " ")}...`} />
        ) : (
          <>
            {/* Payments by Category Table */}
            {activeTab === "payments-by-category" &&
              (payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left font-medium">Receipt</th>
                        <th className="p-3 text-left font-medium">Student</th>
                        <th className="p-3 text-left font-medium">Class</th>
                        <th className="p-3 text-left font-medium">
                          Description
                        </th>
                        <th className="p-3 text-right font-medium">Amount</th>
                        <th className="p-3 text-left font-medium">Method</th>
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-left font-medium">
                          Received By
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={`${payment.payment_id}-${payment.fee_category_id}`}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">
                            <div className="font-mono text-blue-600">
                              {payment.receipt_number}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {payment.first_name} {payment.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.admission_number}
                            </div>
                          </td>
                          <td className="p-3">{payment.class_name}</td>
                          <td className="p-3">
                            <div className="font-medium text-gray-900">
                              {payment.category_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.allocation_description ||
                                "Standard payment"}
                            </div>
                          </td>
                          <td className="p-3 text-right font-medium text-green-600">
                            {formatCurrency(payment.amount_allocated)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                payment.payment_method === "Cash"
                                  ? "bg-green-100 text-green-800"
                                  : payment.payment_method === "Bank Transfer"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {payment.payment_method}
                            </span>
                          </td>
                          <td className="p-3">
                            {new Date(
                              payment.payment_date,
                            ).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {payment.received_by_name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TableCellsIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No payment records found</p>
                  <p className="text-sm">Adjust your filters and try again</p>
                </div>
              ))}

            {/* Student Statements Table */}
            {activeTab === "student-statements" &&
              (students.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Student Statements
                    </h3>
                    <button
                      onClick={() => setShowBulkReminder(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Send Bulk Reminders
                    </button>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left font-medium">Student</th>
                        <th className="p-3 text-left font-medium">
                          Admission No
                        </th>
                        <th className="p-3 text-left font-medium">Class</th>
                        <th className="p-3 text-left font-medium">Parent</th>
                        <th className="p-3 text-right font-medium">
                          Total Bill
                        </th>
                        <th className="p-3 text-right font-medium">Paid</th>
                        <th className="p-3 text-right font-medium">Balance</th>
                        <th className="p-3 text-center font-medium">Status</th>
                        <th className="p-3 text-left font-medium">
                          Last Payment
                        </th>
                        <th className="p-3 text-center font-medium">
                          Reminder
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr
                          key={student.student_id}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleStudentClick(student)}
                        >
                          <td className="p-3">
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            {student.admission_number}
                          </td>
                          <td className="p-3">
                            {student.class_name || "Not assigned"}
                          </td>
                          <td className="p-3">
                            <div className="text-sm">{student.parent_name}</div>
                            <div className="text-xs text-gray-500">
                              {student.parent_email}
                            </div>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(student.total_amount)}
                          </td>
                          <td className="p-3 text-right text-green-600">
                            {formatCurrency(student.paid_amount)}
                          </td>
                          <td className="p-3 text-right font-medium">
                            <span
                              className={
                                student.remaining_balance > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {formatCurrency(student.remaining_balance)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {getStatusBadge(
                              student.remaining_balance,
                              student.is_finalized,
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-500">
                            {student.last_payment_date
                              ? new Date(
                                  student.last_payment_date,
                                ).toLocaleDateString()
                              : "No payments"}
                          </td>
                          <td className="p-3 text-center">
                            {student.remaining_balance > 0 ? (
                              <button
                                onClick={(e) => sendReminder(student, e)}
                                disabled={
                                  sendingReminder === student.student_id
                                }
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  sendingReminder === student.student_id
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : student.parent_email ||
                                        student.student_email
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                                title={
                                  !(
                                    student.parent_email ||
                                    student.student_email
                                  )
                                    ? "No email address"
                                    : "Send balance reminder"
                                }
                              >
                                {sendingReminder === student.student_id ? (
                                  <>
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-700"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Sending
                                  </>
                                ) : (
                                  <>
                                    <EnvelopeIcon className="w-3 h-3 mr-1" />
                                    Remind
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No student records found</p>
                  <p className="text-sm">Adjust your filters and try again</p>
                </div>
              ))}

            {/* Class Collections Table */}
            {activeTab === "class-collections" &&
              (classCollections.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left font-medium">Class</th>
                        <th className="p-3 text-right font-medium">Students</th>
                        <th className="p-3 text-right font-medium">
                          Total Collected
                        </th>
                        <th className="p-3 text-right font-medium">
                          Average Payment
                        </th>
                        <th className="p-3 text-right font-medium">
                          Total Payments
                        </th>
                        <th className="p-3 text-right font-medium">Owing</th>
                        <th className="p-3 text-right font-medium">
                          Fully Paid
                        </th>
                        <th className="p-3 text-right font-medium">Pending</th>
                        <th className="p-3 text-right font-medium">
                          Collection Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {classCollections.map((cls) => {
                        const collectionRate =
                          cls.total_students > 0
                            ? (
                                (cls.students_fully_paid / cls.total_students) *
                                100
                              ).toFixed(1)
                            : 0;

                        return (
                          <tr
                            key={cls.class_id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3 font-medium">
                              {cls.class_name}
                            </td>
                            <td className="p-3 text-right">
                              {cls.total_students}
                            </td>
                            <td className="p-3 text-right font-bold text-green-600">
                              {formatCurrency(cls.total_collected)}
                            </td>
                            <td className="p-3 text-right text-blue-600">
                              {formatCurrency(cls.average_payment)}
                            </td>
                            <td className="p-3 text-right">
                              {cls.total_payments}
                            </td>
                            <td className="p-3 text-right text-red-600">
                              {cls.students_owing}
                            </td>
                            <td className="p-3 text-right text-green-600">
                              {cls.students_fully_paid}
                            </td>
                            <td className="p-3 text-right text-yellow-600">
                              {cls.students_pending}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`font-medium ${
                                  collectionRate >= 80
                                    ? "text-green-600"
                                    : collectionRate >= 50
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }`}
                              >
                                {collectionRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AcademicCapIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No class collection data found</p>
                  <p className="text-sm">Adjust your filters and try again</p>
                </div>
              ))}
          </>
        )}
      </div>
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Export Options
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Export format selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Select Format
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setExportOptions((prev) => ({
                        ...prev,
                        format: "excel",
                      }));
                    }}
                    className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-colors ${
                      exportOptions.format === "excel"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 mb-2 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 2v6h6l-6-6z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Excel</span>
                    <span className="text-xs text-gray-500 mt-1">.xlsx</span>
                  </button>

                  <button
                    onClick={() => {
                      setExportOptions((prev) => ({ ...prev, format: "pdf" }));
                    }}
                    className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-colors ${
                      exportOptions.format === "pdf"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 mb-2 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396 0-.705-.373-1.268-1.255-1.268z" />
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-3.666 9.293c0-.757.268-1.304.785-1.643.511-.334 1.24-.514 2.186-.514.949 0 1.683.18 2.201.537.517.357.778.92.778 1.692v3.861h-1.496v-1.02h-.05c-.163.377-.419.669-.767.876-.348.205-.804.308-1.368.308-.644 0-1.148-.152-1.513-.456-.365-.305-.548-.76-.548-1.363 0-.628.192-1.092.577-1.392.385-.3.935-.449 1.649-.449.457 0 .846.061 1.169.184.322.123.569.277.738.462h.05v-1.23h.033c-.012-.213-.081-.405-.207-.574a1.19 1.19 0 00-.524-.396 2.157 2.157 0 00-.801-.137c-.57 0-1.024.153-1.362.46-.339.307-.508.75-.508 1.33h1.503zm4.988 2.963v1.15h-3.595v-1.15h3.595zM14 9h-1V4l5 5h-4z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">PDF</span>
                    <span className="text-xs text-gray-500 mt-1">.pdf</span>
                  </button>

                  <button
                    onClick={() => {
                      setExportOptions((prev) => ({ ...prev, format: "csv" }));
                    }}
                    className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-colors ${
                      exportOptions.format === "csv"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">CSV</span>
                    <span className="text-xs text-gray-500 mt-1">.csv</span>
                  </button>
                </div>
              </div>

              {/* Additional options */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeAllData"
                    checked={exportOptions.includeAllData}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeAllData: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="includeAllData"
                    className="ml-3 text-sm text-gray-700"
                  >
                    Export all data (ignore current filters)
                  </label>
                </div>

                {exportOptions.format === "pdf" && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeSummary"
                      checked={exportOptions.includeSummary}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          includeSummary: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="includeSummary"
                      className="ml-3 text-sm text-gray-700"
                    >
                      Include summary section in PDF
                    </label>
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium">Export Details:</p>
                    <p className="mt-1">
                      {exportOptions.format === "pdf"
                        ? "PDF files are best for printing and sharing. They include proper formatting and page numbers."
                        : exportOptions.format === "csv"
                          ? "CSV files are good for data analysis in other software. They contain raw data without formatting."
                          : "Excel files include formatting and are best for further analysis and manipulation."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowExportModal(false);

                    if (exportOptions.includeAllData) {
                      // Export all data with empty filters
                      await handleExportWithFilters({}, exportOptions.format);
                    } else {
                      // Export with current filters
                      await handleExport(exportOptions.format);
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                      Export {exportOptions.format.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Payment Details: {selectedStudent.first_name}{" "}
                  {selectedStudent.last_name}
                </h3>
                <p className="text-gray-600">
                  Admission: {selectedStudent.admission_number} | Class:{" "}
                  {selectedStudent.class_name} | Status:{" "}
                  {getStatusText(
                    selectedStudent.remaining_balance,
                    selectedStudent.is_finalized,
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedStudent(null);
                  setPaymentDetails([]);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Bill</p>
                <p className="text-xl font-bold">
                  {formatCurrency(selectedStudent.total_amount)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Amount Paid</p>
                <p className="text-xl font-bold">
                  {formatCurrency(selectedStudent.paid_amount)}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  selectedStudent.remaining_balance > 0
                    ? "bg-red-50"
                    : "bg-green-50"
                }`}
              >
                <p className="text-sm">Balance</p>
                <p
                  className={`text-xl font-bold ${
                    selectedStudent.remaining_balance > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(selectedStudent.remaining_balance)}
                </p>
              </div>
            </div>

            {/* Payment History Table */}
            {loadingPayments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading payment history...</p>
              </div>
            ) : paymentDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Receipt No</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-left">Reference</th>
                      <th className="p-3 text-left">Received By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentDetails.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3 font-mono text-blue-600">
                          {payment.receipt_number}
                        </td>
                        <td className="p-3">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">
                          {formatCurrency(payment.amount_paid)}
                        </td>
                        <td className="p-3 text-gray-500">
                          {payment.reference_number || "N/A"}
                        </td>
                        <td className="p-3">{payment.received_by_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BanknotesIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No payment history found</p>
                <p className="text-sm">
                  This student hasn't made any payments yet
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkReminderModal
        isOpen={showBulkReminder}
        onClose={() => setShowBulkReminder(false)}
        filters={{
          academic_year_id: selectedAcademicYear,
          term_id: selectedTerm,
          // class_id: classes.find((cls) => cls.class_name === className)?.class_id || null,
          academic_year_label: getSelectedAcademicYear()
            ? `${getSelectedAcademicYear().year_label}${
                getSelectedAcademicYear().is_current ? " (Current)" : ""
              }`
            : null,
          term_name: getSelectedTerm() ? getSelectedTerm().term_name : null,
          // class_name: classes.find((cls) => cls.class_name === className)?.class_name || "All Classes",
        }}
        onComplete={(results) => {
          // Optionally refresh data
          if (results.sent_count > 0) {
            fetchStudentStatements(); // Refresh your data
          }
        }}
      />
    </div>
  );
};

export default FinancialRecords;
