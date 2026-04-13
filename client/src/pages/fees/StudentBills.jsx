import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PlusIcon,
  EyeIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentCheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalculatorIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronDoubleLeftIcon,
  ChevronRightIcon as ChevronRight,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BillPreview from "../../components/bill-preview/BillPreview";
import { useAcademicData } from "../../hooks/useAcademicContext";
import useDebounce from "../../hooks/useDebounce";
import api from "../../components/axiosconfig/axiosConfig";

const StudentBills = () => {
  const {
    academicYears,
    terms,
    selectedAcademicYear,
    selectedTerm,
    handleAcademicYearChange: contextHandleAcademicYearChange,
    handleTermChange,
    loading: academicLoading,
    getSelectedAcademicYear,
    getSelectedTerm,
  } = useAcademicData();

  // Custom usePersistedState hook
  const usePersistedState = (key, defaultValue) => {
    const [state, setState] = useState(() => {
      try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
      } catch {
        return defaultValue;
      }
    });

    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
  };

  // State management
  const [loading, setLoading] = useState(true);
  const [generatingBills, setGeneratingBills] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [studentsWithBills, setStudentsWithBills] = useState({});
  const [studentArrears, setStudentArrears] = useState({});
  const [studentOverpayments, setStudentOverpayments] = useState({});
  const [previewBill, setPreviewBill] = useState(null);

  // Delete operations states
  const [deletingArrears, setDeletingArrears] = useState(false);
  const [deletingOverpayments, setDeletingOverpayments] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(null);
  const [showErrorMessage, setShowErrorMessage] = useState(null);
  const [arrearsDeleted, setArrearsDeleted] = useState(false);
  const [overpaymentsDeleted, setOverpaymentsDeleted] = useState(false);

  // Collapsible section state
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  // Filters with debounced search
  const [filters, setFilters] = usePersistedState("studentBillsFilters", {
    class_id: "",
    academic_year_id: "",
    term_id: "",
    status: "all",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Dropdown data
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Sync filters with academic context
  useEffect(() => {
    if (
      selectedAcademicYear &&
      selectedAcademicYear !== filters.academic_year_id
    ) {
      setFilters((prev) => ({
        ...prev,
        academic_year_id: selectedAcademicYear,
      }));
    }

    if (selectedTerm && selectedTerm !== filters.term_id) {
      setFilters((prev) => ({
        ...prev,
        term_id: selectedTerm,
      }));
    }
  }, [selectedAcademicYear, selectedTerm]);

  // Initialize data
  useEffect(() => {
    fetchInitialData();

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, []);

  // Debounced effect for filters - fetches bills when debounced filters change
  useEffect(() => {
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));

    if (
      filters.class_id ||
      filters.academic_year_id ||
      filters.term_id ||
      filters.status !== "all"
    ) {
      fetchBills(1);
    }
  }, [
    filters.class_id,
    filters.academic_year_id,
    filters.term_id,
    filters.status,
  ]);

  // Fetch initial data
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const classesRes = await api.get(
        "/getclasses"
      );
      setClasses(classesRes.data);

      if (!filters.class_id && classesRes.data.length > 0) {
        setFilters((prev) => ({ ...prev, class_id: classesRes.data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      alert("Error loading classes");
    }
    setLoading(false);
  };

  // Memoized fetch bills function
  const fetchBills = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page,
          limit: pagination.limit,
          ...(filters.class_id && { class_id: filters.class_id }),
          ...(filters.academic_year_id && {
            academic_year_id: filters.academic_year_id,
          }),
          ...(filters.term_id && { term_id: filters.term_id }),
          ...(filters.status !== "all" && { status: filters.status }),
          active_only: "true",
        });

        const response = await api.get(
          `/getstudentbills?${params}`
        );

        // Handle both old and new response formats
        const billsData = response.data.bills || response.data;
        const paginationData = response.data.pagination || {
          page: page,
          limit: pagination.limit,
          total: billsData.length,
          totalPages: Math.ceil(billsData.length / pagination.limit),
          hasNextPage: false,
          hasPrevPage: page > 1,
        };

        const groupedData = groupBillsByStudent(billsData);
        const studentIds = Object.keys(groupedData);

        // Fetch balances and term bills in parallel
        await Promise.all([
          fetchStudentBalances(studentIds),
          fetchStudentTermBills(groupedData).then(
            (studentDataWithTermBills) => {
              setStudentsWithBills(studentDataWithTermBills);
            }
          ),
        ]);

        setPagination(paginationData);
      } catch (error) {
        console.error("Error fetching student bills:", error);
        alert("Error loading student bills");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit, pagination.page]
  );

  // Group bills by student
  const groupBillsByStudent = (bills) => {
    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return {};
    }

    return bills.reduce((acc, bill) => {
      const studentId = bill.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: {
            id: bill.student_id,
            name: `${bill.first_name} ${bill.last_name}`,
            admission_number: bill.admission_number,
            class_name: bill.class_name,
          },
          bills: [],
          totals: {
            compulsory: 0,
            optional: 0,
            total: 0,
            paid: 0,
            balance: 0,
          },
          status: "Pending",
          finalizedBill: null,
        };
      }

      acc[studentId].bills.push(bill);

      const amount = parseFloat(bill.amount);
      if (bill.is_compulsory) {
        acc[studentId].totals.compulsory += amount;
      } else {
        acc[studentId].totals.optional += amount;
      }
      acc[studentId].totals.total += amount;

      return acc;
    }, {});
  };

  // Fetch student balances
  const fetchStudentBalances = async (studentIds) => {
    if (studentIds.length === 0) return;

    try {
      const arrearsPromises = studentIds.map((studentId) =>
        api.get(`/getstudentarrears/${studentId}`)
      );

      const overpaymentsPromises = studentIds.map((studentId) =>
        api.get(
          `/getstudentoverpayments/${studentId}`
        )
      );

      const [arrearsResults, overpaymentsResults] = await Promise.all([
        Promise.all(arrearsPromises),
        Promise.all(overpaymentsPromises),
      ]);

      const arrearsMap = {};
      const overpaymentsMap = {};

      studentIds.forEach((studentId, index) => {
        arrearsMap[studentId] = arrearsResults[index].data;
        overpaymentsMap[studentId] = overpaymentsResults[index].data.filter(
          (op) => op.status === "Active"
        );
      });

      setStudentArrears((prev) => ({ ...prev, ...arrearsMap }));
      setStudentOverpayments((prev) => ({ ...prev, ...overpaymentsMap }));
    } catch (error) {
      console.error("Error fetching student balances:", error);
    }
  };

  // Fetch student term bills
  const fetchStudentTermBills = async (studentData) => {
    try {
      const studentIds = Object.keys(studentData);

      if (!filters.academic_year_id || !filters.term_id) {
        return studentData;
      }

      const termBillPromises = studentIds.map(async (studentId) => {
        try {
          const response = await api.get(
            `/getstudenttermbill/${studentId}?academic_year_id=${filters.academic_year_id}&term_id=${filters.term_id}`
          );

          const termBillData = response.data;

          if (
            termBillData.selected_bills &&
            typeof termBillData.selected_bills === "string"
          ) {
            try {
              termBillData.selected_bills = JSON.parse(
                termBillData.selected_bills
              );
            } catch (parseError) {
              console.error("Error parsing selected_bills:", parseError);
              termBillData.selected_bills = null;
            }
          }

          return {
            studentId,
            termBill: termBillData,
            error: null,
          };
        } catch (error) {
          return {
            studentId,
            termBill: null,
            error: error.response?.status === 404 ? "Not Found" : error.message,
          };
        }
      });

      const termBillsResults = await Promise.all(termBillPromises);

      const updatedStudentData = { ...studentData };

      termBillsResults.forEach(({ studentId, termBill, error }) => {
        if (updatedStudentData[studentId] && termBill) {
          updatedStudentData[studentId].finalizedBill = termBill;

          if (termBill.selected_bills) {
            const bill_ids = termBill.selected_bills.bill_ids || [];
            const edited_amounts = termBill.selected_bills.edited_amounts || {};

            updatedStudentData[studentId].bills = updatedStudentData[
              studentId
            ].bills.map((bill) => {
              const isSelected = bill_ids.includes(bill.id);
              const finalAmount =
                edited_amounts[bill.id] !== undefined
                  ? edited_amounts[bill.id]
                  : parseFloat(bill.amount);

              return {
                ...bill,
                isSelected,
                finalAmount,
                originalAmount: parseFloat(bill.amount),
              };
            });
          } else {
            updatedStudentData[studentId].bills = updatedStudentData[
              studentId
            ].bills.map((bill) => ({
              ...bill,
              isSelected: true,
              finalAmount: parseFloat(bill.amount),
              originalAmount: parseFloat(bill.amount),
            }));
          }

          const totals = calculateStudentTotals(updatedStudentData[studentId]);
          updatedStudentData[studentId].totals = totals;
          updatedStudentData[studentId].status = totals.status;
        }
      });

      return updatedStudentData;
    } catch (error) {
      console.error("Error in fetchStudentTermBills:", error);
      return studentData;
    }
  };

  // Memoized filtered students with debounced search
  const filteredStudents = useMemo(() => {
    const allStudents = Object.values(studentsWithBills);

    if (!debouncedSearchQuery.trim()) {
      return allStudents;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return allStudents.filter(
      (student) =>
        student.student.name.toLowerCase().includes(query) ||
        student.student.admission_number.toLowerCase().includes(query) ||
        student.student.class_name.toLowerCase().includes(query)
    );
  }, [studentsWithBills, debouncedSearchQuery]);

  // Calculate student totals
  const calculateStudentTotals = useCallback(
    (studentData) => {
      try {
        const studentId = studentData.student.id;

        const currentArrearsTotal = studentArrears[studentId]
          ? studentArrears[studentId].reduce(
              (sum, arrear) => sum + (parseFloat(arrear.amount) || 0),
              0
            )
          : 0;

        const currentOverpaymentsTotal = studentOverpayments[studentId]
          ? studentOverpayments[studentId].reduce(
              (sum, overpayment) => sum + (parseFloat(overpayment.amount) || 0),
              0
            )
          : 0;

        if (studentData.finalizedBill) {
          const currentTermTotal =
            parseFloat(studentData.finalizedBill.total_amount) || 0;
          const paidAmount =
            parseFloat(studentData.finalizedBill.paid_amount) || 0;
          const remainingBalance =
            parseFloat(studentData.finalizedBill.remaining_balance) ||
            currentTermTotal;

          let status = "Pending";
          if (paidAmount >= currentTermTotal && currentTermTotal > 0) {
            status = "Paid";
          } else if (paidAmount > 0 && paidAmount < currentTermTotal) {
            status = "Partially Paid";
          }

          return {
            compulsory:
              parseFloat(studentData.finalizedBill.compulsory_amount) || 0,
            optional:
              parseFloat(studentData.finalizedBill.optional_amount) || 0,
            currentTermTotal: currentTermTotal,
            arrearsTotal: 0,
            overpaymentsTotal: 0,
            total: currentTermTotal,
            paid: paidAmount,
            balance: remainingBalance,
            isFinalized: true,
            status: status,
          };
        }

        // For NON-FINALIZED bills
        const compulsoryTotal = studentData.bills
          .filter((bill) => bill.is_compulsory)
          .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

        const optionalTotal = studentData.bills
          .filter((bill) => !bill.is_compulsory)
          .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

        const currentTermTotal = compulsoryTotal;
        const netTotal = Math.max(
          currentTermTotal + currentArrearsTotal - currentOverpaymentsTotal,
          0
        );

        return {
          compulsory: compulsoryTotal,
          optional: optionalTotal,
          currentTermTotal: currentTermTotal,
          arrearsTotal: currentArrearsTotal,
          overpaymentsTotal: currentOverpaymentsTotal,
          total: netTotal,
          paid: 0,
          balance: netTotal,
          isFinalized: false,
          status: "Pending",
        };
      } catch (error) {
        console.error("Error in calculateStudentTotals:", error);
        return {
          compulsory: 0,
          optional: 0,
          currentTermTotal: 0,
          arrearsTotal: 0,
          overpaymentsTotal: 0,
          total: 0,
          paid: 0,
          balance: 0,
          isFinalized: false,
          status: "Pending",
        };
      }
    },
    [studentArrears, studentOverpayments]
  );

  // Pagination handlers
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage < 1 || newPage > pagination.totalPages) return;

      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchBills(newPage);

      // Clear expanded students when changing page
      setExpandedStudents({});
    },
    [pagination.totalPages, fetchBills]
  );

  const goToFirstPage = () => handlePageChange(1);
  const goToPrevPage = () => handlePageChange(pagination.page - 1);
  const goToNextPage = () => handlePageChange(pagination.page + 1);
  const goToLastPage = () => handlePageChange(pagination.totalPages);

  // Show message function
  const showMessage = useCallback((message, isError = false) => {
    if (isError) {
      setShowErrorMessage(message);
      setTimeout(() => setShowErrorMessage(null), 5000);
    } else {
      setShowSuccessMessage(message);
      setTimeout(() => setShowSuccessMessage(null), 5000);
    }
  }, []);

  // Toggle delete section
  const toggleDeleteSection = () => {
    if (showDeleteSection) {
      setShowDeleteSection(false);
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    } else {
      setShowDeleteSection(true);

      // Set timer to auto-hide after 30 seconds
      const timer = setTimeout(() => {
        setShowDeleteSection(false);
      }, 30000);

      setAutoHideTimer(timer);
    }
  };

  // Delete all arrears
  const handleDeleteAllArrears = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL student arrears records? This action cannot be undone!"
      )
    ) {
      return;
    }

    setDeletingArrears(true);
    try {
      const response = await api.delete(
        "/student-arrears"
      );

      if (response.data.success) {
        showMessage(
          `✅ Successfully deleted ${response.data.deletedCount} arrears records`
        );
        setArrearsDeleted(true);

        // Clear arrears from local state
        setStudentArrears({});

        // Refresh bills to update totals
        fetchBills();

        // Auto-hide section after successful deletion
        setTimeout(() => {
          setShowDeleteSection(false);
        }, 3000);
      } else {
        showMessage(response.data.error || "Failed to delete arrears", true);
      }
    } catch (error) {
      console.error("Error deleting arrears:", error);
      showMessage(
        error.response?.data?.error || "Error deleting arrears",
        true
      );
    } finally {
      setDeletingArrears(false);
    }
  };

  // Delete all overpayments
  const handleDeleteAllOverpayments = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete ALL student overpayments records? This action cannot be undone!"
      )
    ) {
      return;
    }

    setDeletingOverpayments(true);
    try {
      const response = await api.delete(
        "/student-overpayments"
      );

      if (response.data.success) {
        showMessage(
          `✅ Successfully deleted ${response.data.deletedCount} overpayment records`
        );
        setOverpaymentsDeleted(true);

        // Clear overpayments from local state
        setStudentOverpayments({});

        // Refresh bills to update totals
        fetchBills();

        // Auto-hide section after successful deletion
        setTimeout(() => {
          setShowDeleteSection(false);
        }, 3000);
      } else {
        showMessage(
          response.data.error || "Failed to delete overpayments",
          true
        );
      }
    } catch (error) {
      console.error("Error deleting overpayments:", error);
      showMessage(
        error.response?.data?.error || "Error deleting overpayments",
        true
      );
    } finally {
      setDeletingOverpayments(false);
    }
  };

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      class_id: "",
      academic_year_id: "",
      term_id: "",
      status: "all",
    });
    setSearchQuery("");
    handlePageChange(1);
  }, [handlePageChange, setFilters]);

  // Generate bill preview
  const generateBillPreview = useCallback(
    (studentData) => {
      const totals = calculateStudentTotals(studentData);
      const hasFinalizedBill = !!studentData.finalizedBill;

      const compulsoryBills = studentData.bills.filter(
        (bill) => bill.is_compulsory
      );
      const optionalBills = studentData.bills.filter(
        (bill) => !bill.is_compulsory
      );

      const displayOptionalBills = hasFinalizedBill
        ? optionalBills.filter((bill) => bill.isSelected)
        : optionalBills;

      return {
        student: studentData.student,
        compulsoryBills,
        optionalBills: displayOptionalBills,
        arrears: studentArrears[studentData.student.id] || [],
        overpayments: studentOverpayments[studentData.student.id] || [],
        totals,
        isFinalized: hasFinalizedBill,
        finalizedBill: studentData.finalizedBill,
      };
    },
    [calculateStudentTotals, studentArrears, studentOverpayments]
  );

  // Handle preview bill
  const handlePreviewBill = useCallback(
    (studentData) => {
      const preview = generateBillPreview(studentData);
      setPreviewBill(preview);
    },
    [generateBillPreview]
  );

  // Close preview
  const handleClosePreview = () => {
    setPreviewBill(null);
  };

  // Download all bills PDF
  const downloadAllBillsPDF = async () => {
    if (!filters.class_id || !filters.academic_year_id || !filters.term_id) {
      alert("Please select class, academic year, and term first");
      return;
    }

    try {
      setGeneratingBills(true);

      const { class_id, academic_year_id, term_id } = filters;

      const response = await api.get(
       `/class-bills-pdf/${class_id}/${academic_year_id}/${term_id}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const className =
        classes.find((c) => c.id === parseInt(class_id))?.class_name || "class";
      link.setAttribute(
        "download",
        `${className}-all-bills-${academic_year_id}-${term_id}.pdf`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading combined PDF:", error);
      alert("Failed to download combined PDF. Please try again.");
    } finally {
      setGeneratingBills(false);
    }
  };

  // Generate bills from templates
  const generateBillsFromTemplates = async () => {
    if (!filters.class_id || !filters.academic_year_id || !filters.term_id) {
      alert("Please select class, academic year, and term first");
      return;
    }

    try {
      const checkResponse = await api.get(
        `/students-with-previous-balances?academic_year_id=${filters.academic_year_id}&term_id=${filters.term_id}&class_id=${filters.class_id}`
      );

      let confirmationMessage = `Generate bills for all students in this class for the selected term?`;

      if (checkResponse.data.length > 0) {
        const balanceDetails = checkResponse.data
          .slice(0, 5)
          .map(
            (s) =>
              `  • ${s.first_name} ${s.last_name}: Ghc ${s.outstanding_balance}`
          )
          .join("\n");

        confirmationMessage += `\n\n${checkResponse.data.length} student(s) have previous outstanding balances that will be automatically carried forward:\n${balanceDetails}`;

        if (checkResponse.data.length > 5) {
          confirmationMessage += `\n  ...and ${
            checkResponse.data.length - 5
          } more`;
        }
      }

      if (!window.confirm(confirmationMessage)) {
        return;
      }

      setGeneratingBills(true);

      const response = await api.post(
        "/generatebillsfromtemplates",
        {
          class_id: filters.class_id,
          academic_year_id: filters.academic_year_id,
          term_id: filters.term_id,
          created_by: 1,
        }
      );

      if (response.data.details?.carriedBalanceList?.length > 0) {
        const successDetails = response.data.details.carriedBalanceList
          .map(
            (b) =>
              `• ${b.student_name}: Ghc ${b.previous_balance.toFixed(
                2
              )} (from ${b.previous_period})`
          )
          .join("\n");

        alert(
          `✅ Successfully generated ${response.data.generated} bills\n\nPrevious balances carried forward:\n${successDetails}`
        );
      } else {
        alert(
          `✅ Successfully generated ${response.data.generated} student bills`
        );
      }

      fetchBills();
    } catch (error) {
      console.error("Error generating bills:", error);

      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else if (error.response?.data?.details) {
        alert(`Error: ${error.response.data.details}`);
      } else {
        alert("Error generating bills: " + error.message);
      }
    } finally {
      setGeneratingBills(false);
    }
  };

  // Toggle student expanded
  const toggleStudentExpanded = (studentId) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  // Status helpers
  const getStatusColor = (status) => {
    const colors = {
      Paid: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      "Partially Paid": "bg-blue-100 text-blue-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Paid: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
      Pending: <ClockIcon className="w-5 h-5 text-yellow-500" />,
      "Partially Paid": <BanknotesIcon className="w-5 h-5 text-blue-500" />,
      Cancelled: <XCircleIcon className="w-5 h-5 text-red-500" />,
    };
    return icons[status] || <ClockIcon className="w-5 h-5 text-gray-500" />;
  };

  // Handle receive payment
  const handleReceivePayment = (studentData) => {
    const currentAcademicContext = {
      academic_year_id: filters.academic_year_id,
      term_id: filters.term_id,
      class_id: filters.class_id,
    };

    if (studentData.finalizedBill) {
      navigate("/finance/select-bills", {
        state: {
          studentId: studentData.student.id,
          studentInfo: studentData.student,
          finalizedBill: studentData.finalizedBill,
          totals: studentData.totals,
          academicContext: currentAcademicContext,
        },
      });
    } else {
      navigate("/finance/select-bills", {
        state: {
          studentId: studentData.student.id,
          studentInfo: studentData.student,
          academicContext: currentAcademicContext,
        },
      });
    }
  };

  // Academic year change handler
  const handleAcademicYearChange = (e) => {
    const yearId = e.target.value;
    contextHandleAcademicYearChange(yearId);
    setFilters((prev) => ({ ...prev, academic_year_id: yearId, term_id: "" }));
    setExpandedStudents({});
  };

  // Term change handler
  const handleTermChangeWrapper = (e) => {
    const termId = e.target.value;
    handleTermChange(termId);
    setFilters((prev) => ({ ...prev, term_id: termId }));
    setExpandedStudents({});
  };

  // Memoized calculations
  const currentTermTotal = useMemo(() => {
    return filteredStudents.reduce((sum, student) => {
      const totals = calculateStudentTotals(student);
      return sum + (parseFloat(student?.totals?.currentTermTotal) || 0);
    }, 0);
  }, [filteredStudents, calculateStudentTotals]);

  const totalAmountPaid = useMemo(() => {
    return filteredStudents.reduce((sum, student) => {
      const totals = calculateStudentTotals(student);
      return sum + (parseFloat(student?.totals?.paid) || 0);
    }, 0);
  }, [filteredStudents, calculateStudentTotals]);

  const totalBalance = useMemo(() => {
    return currentTermTotal - totalAmountPaid;
  }, [currentTermTotal, totalAmountPaid]);

  const selectedYear = getSelectedAcademicYear();
  const selectedTermDetails = getSelectedTerm();
  const hasActiveFilters = useMemo(() => {
    return (
      filters.class_id ||
      filters.academic_year_id ||
      filters.term_id ||
      filters.status !== "all" ||
      searchQuery
    );
  }, [filters, searchQuery]);

  if ((loading && !filters.academic_year_id) || academicLoading) {
    return <LoadingSpinner text="Loading student bills..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Messages */}
      {showSuccessMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700 font-medium">
              {showSuccessMessage}
            </span>
          </div>
        </div>
      )}
      {showErrorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">{showErrorMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Bills</h1>
          <p className="text-gray-600">View and manage student fee bills</p>
          {selectedYear && selectedTermDetails && (
            <div className="mt-1 text-sm text-blue-600 flex items-center space-x-2">
              <span className="bg-blue-100 px-2 py-0.5 rounded">
                {selectedYear?.year_label || "No year selected"}
              </span>
              <span>•</span>
              <span className="bg-blue-100 px-2 py-0.5 rounded">
                {selectedTermDetails?.term_name || "No term selected"}
              </span>
              <span>•</span>
              <span className="bg-blue-100 px-2 py-0.5 rounded">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateBillsFromTemplates}
            disabled={
              generatingBills ||
              !filters.class_id ||
              !filters.academic_year_id ||
              !filters.term_id
            }
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{generatingBills ? "Generating..." : "Generate Bills"}</span>
          </button>

          <button
            onClick={downloadAllBillsPDF}
            disabled={!filters.class_id || filteredStudents.length === 0}
            className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Download All Bills</span>
          </button>
        </div>
      </div>

      {/* Delete Section */}
      {showDeleteSection && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 bg-red-100">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">
                Database Delete Tools
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {autoHideTimer && (
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  Auto-hides in{" "}
                  {Math.ceil(
                    (30000 -
                      (Date.now() -
                        (autoHideTimer?._idleStart || Date.now()))) /
                      1000
                  )}
                  s
                </span>
              )}
              <button
                onClick={() => setShowDeleteSection(false)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <p className="text-red-700 mb-2">
                <strong>⚠️ WARNING:</strong> These actions are cautious and
                should only be used when starting a new term.
              </p>
              <div className="text-sm text-red-600">
                <p>• Use only when transitioning to a new academic term</p>
                <p>• Ensure all payments have been processed</p>
                <p>• Backup data before proceeding</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAllArrears}
                disabled={deletingArrears || arrearsDeleted}
                className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">
                    {deletingArrears
                      ? "Deleting..."
                      : arrearsDeleted
                      ? "Arrears Deleted"
                      : "Delete All Arrears"}
                  </div>
                  <div className="text-xs opacity-80">
                    Clears all outstanding balances
                  </div>
                </div>
              </button>

              <button
                onClick={handleDeleteAllOverpayments}
                disabled={deletingOverpayments || overpaymentsDeleted}
                className="flex-1 flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">
                    {deletingOverpayments
                      ? "Deleting..."
                      : overpaymentsDeleted
                      ? "Overpayments Deleted"
                      : "Delete All Overpayments"}
                  </div>
                  <div className="text-xs opacity-80">
                    Clears all credit balances
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <div
                className={`flex items-center ${
                  arrearsDeleted ? "text-green-600" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    arrearsDeleted ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                Arrears: {arrearsDeleted ? "Cleared" : "Pending"}
              </div>
              <div
                className={`flex items-center ${
                  overpaymentsDeleted ? "text-green-600" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    overpaymentsDeleted ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
                Overpayments: {overpaymentsDeleted ? "Cleared" : "Pending"}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="text-xs text-red-500 text-center border-t border-red-200 pt-3">
              This section will automatically close in{" "}
              {Math.ceil(
                (30000 -
                  (Date.now() - (autoHideTimer?._idleStart || Date.now()))) /
                  1000
              )}{" "}
              seconds
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Name, admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, class_id: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Classes</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={filters.academic_year_id}
              onChange={handleAcademicYearChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              value={filters.term_id}
              onChange={handleTermChangeWrapper}
              disabled={!filters.academic_year_id || terms.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {terms.length === 0 ? "Select year first" : "Select Term"}
              </option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.term_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredStudents.length} student(s)
              {filters.status !== "all" && ` with status: ${filters.status}`}
            </div>
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Students with Bills
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredStudents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="w-8 h-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Finalized Amount
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Ghc {currentTermTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BanknotesIcon className="w-8 h-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Amount Paid
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Ghc {totalAmountPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalculatorIcon className="w-8 h-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                Ghc {totalBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((studentData) => (
            <StudentCard
              key={studentData.student.id}
              studentData={studentData}
              isExpanded={expandedStudents[studentData.student.id]}
              toggleExpanded={toggleStudentExpanded}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              handlePreviewBill={handlePreviewBill}
              handleReceivePayment={handleReceivePayment}
              calculateStudentTotals={calculateStudentTotals}
              studentArrears={studentArrears}
              studentOverpayments={studentOverpayments}
            />
          ))
        ) : (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
            filters={filters}
            generateBillsFromTemplates={generateBillsFromTemplates}
          />
        )}
      </div>

      {/* Bill Preview Modal */}
      <BillPreview preview={previewBill} onClose={handleClosePreview} />
    </div>
  );
};

// Extracted Student Card Component
const StudentCard = React.memo(
  ({
    studentData,
    isExpanded,
    toggleExpanded,
    getStatusColor,
    getStatusIcon,
    handlePreviewBill,
    handleReceivePayment,
    calculateStudentTotals,
    studentArrears,
    studentOverpayments,
  }) => {
    const totals = calculateStudentTotals(studentData);
    const hasFinalizedBill = !!studentData.finalizedBill;

    return (
      <div className="bg-white rounded-lg shadow border">
        <StudentCardHeader
          studentData={studentData}
          isExpanded={isExpanded}
          toggleExpanded={toggleExpanded}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          totals={totals}
          hasFinalizedBill={hasFinalizedBill}
        />

        {isExpanded && (
          <StudentCardDetails
            studentData={studentData}
            totals={totals}
            hasFinalizedBill={hasFinalizedBill}
            handlePreviewBill={handlePreviewBill}
            handleReceivePayment={handleReceivePayment}
            studentArrears={studentArrears}
            studentOverpayments={studentOverpayments}
          />
        )}
      </div>
    );
  }
);

// Extracted Student Card Header
const StudentCardHeader = React.memo(
  ({
    studentData,
    isExpanded,
    toggleExpanded,
    getStatusColor,
    getStatusIcon,
    totals,
    hasFinalizedBill,
  }) => {
    return (
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => toggleExpanded(studentData.student.id)}
      >
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(studentData.student.id);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <UserIcon className="w-8 h-8 text-gray-400" />

          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {studentData.student.name}
              </h3>
              {hasFinalizedBill && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <DocumentCheckIcon className="w-3 h-3 mr-1" />
                  Bill Finalized
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {studentData.student.admission_number} •{" "}
              {studentData.student.class_name}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {getStatusIcon(studentData.status)}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                studentData.status
              )}`}
            >
              {studentData.status}
              {studentData.status === "Paid" && (
                <CheckIcon className="w-4 h-4 ml-1" />
              )}
            </span>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className="text-lg font-bold text-gray-900">
            {hasFinalizedBill ? (
              <>
                Ghc {studentData.finalizedBill.total_amount}
                <div className="text-xs text-green-600 font-medium">
                  Finalized Total
                </div>
              </>
            ) : (
              <>
                Ghc {totals?.total}
                <div className="text-xs text-blue-600 font-medium">
                  Estimated Total
                </div>
              </>
            )}
          </div>

          {hasFinalizedBill && studentData.finalizedBill && (
            <StudentCardBalance finalizedBill={studentData.finalizedBill} />
          )}

          <div className="text-sm text-gray-500 flex items-center justify-end space-x-1">
            <span>
              {hasFinalizedBill
                ? `${
                    studentData.bills.filter((bill) => bill.isSelected === true)
                      .length
                  } of ${studentData.bills?.length || 0} bills selected`
                : `${
                    studentData.bills.filter((bill) => bill.is_compulsory)
                      .length
                  } compulsory, ${
                    studentData.bills.filter((bill) => !bill.is_compulsory)
                      .length
                  } optional`}
            </span>
            {hasFinalizedBill && (
              <DocumentCheckIcon className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

// Extracted Student Card Balance
const StudentCardBalance = React.memo(({ finalizedBill }) => {
  const balance = Math.abs(finalizedBill.remaining_balance || 0);
  const paid = Math.abs(finalizedBill.paid_amount || 0);
  const isCredit = finalizedBill.remaining_balance < 0;

  return (
    <>
      <div className="text-lg text-blue-500 font-medium">
        Paid: Ghc {paid.toFixed(2)}
      </div>
      <div
        className={`text-sm ${
          finalizedBill.remaining_balance > 0
            ? "text-red-600"
            : isCredit
            ? "text-green-600"
            : "text-gray-600"
        }`}
      >
        Balance: Ghc {balance.toFixed(2)}
        {finalizedBill.remaining_balance > 0
          ? " Due"
          : isCredit
          ? " Credit"
          : " Paid"}
      </div>
    </>
  );
});

// Extracted Student Card Details
const StudentCardDetails = React.memo(
  ({
    studentData,
    totals,
    hasFinalizedBill,
    handlePreviewBill,
    handleReceivePayment,
    studentArrears,
    studentOverpayments,
  }) => {
    return (
      <div className="border-t border-gray-200">
        <FeeBreakdown
          totals={totals}
          hasFinalizedBill={hasFinalizedBill}
          studentData={studentData}
          studentArrears={studentArrears}
          studentOverpayments={studentOverpayments}
        />
        <IndividualBillsTable
          studentData={studentData}
          hasFinalizedBill={hasFinalizedBill}
        />
        <StudentCardActions
          studentData={studentData}
          hasFinalizedBill={hasFinalizedBill}
          handlePreviewBill={handlePreviewBill}
          handleReceivePayment={handleReceivePayment}
        />
      </div>
    );
  }
);

// Extracted Fee Breakdown
const FeeBreakdown = React.memo(
  ({
    totals,
    hasFinalizedBill,
    studentData,
    studentArrears,
    studentOverpayments,
  }) => {
    // Calculate arrears and overpayments for this specific student
    const studentId = studentData.student.id;

    const currentArrearsTotal = studentArrears[studentId]
      ? studentArrears[studentId].reduce(
          (sum, arrear) => sum + (parseFloat(arrear.amount) || 0),
          0
        )
      : 0;

    const currentOverpaymentsTotal = studentOverpayments[studentId]
      ? studentOverpayments[studentId].reduce(
          (sum, overpayment) => sum + (parseFloat(overpayment.amount) || 0),
          0
        )
      : 0;

    return (
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Compulsory Fees:</span>
            <div className="font-semibold text-red-600">
              Ghc {totals.compulsory.toFixed(2)}
            </div>
          </div>

          {totals.isFinalized && totals.optional > 0 && (
            <div>
              <span className="text-gray-600">Optional Fees:</span>
              <div className="font-semibold text-blue-600">
                Ghc {totals.optional.toFixed(2)}
              </div>
            </div>
          )}

          {currentArrearsTotal > 0 && (
            <div>
              <span className="text-gray-600">
                {totals.isFinalized
                  ? "Included Arrears:"
                  : "Outstanding Arrears:"}
              </span>
              <div className="font-semibold text-orange-600">
                Ghc {currentArrearsTotal.toFixed(2)}
              </div>
            </div>
          )}

          {currentOverpaymentsTotal > 0 && (
            <div>
              <span className="text-gray-600">
                {totals.isFinalized ? "Applied Credits:" : "Available Credits:"}
              </span>
              <div className="font-semibold text-green-600">
                Ghc {currentOverpaymentsTotal.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {hasFinalizedBill && studentData.finalizedBill && (
          <FinalizedBillInfo finalizedBill={studentData.finalizedBill} />
        )}
      </div>
    );
  }
);

// Extracted Finalized Bill Info
const FinalizedBillInfo = React.memo(({ finalizedBill }) => (
  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
    <div className="flex items-center space-x-2 text-green-800">
      <DocumentCheckIcon className="w-4 h-4" />
      <span className="text-sm font-medium">Finalized Bill Information</span>
    </div>
    <div className="text-xs text-green-700 mt-1">
      This bill includes all selected fees, arrears, and credits.
      {finalizedBill.updated_at && (
        <span>
          {" "}
          Finalized on {new Date(finalizedBill.updated_at).toLocaleDateString()}
        </span>
      )}
    </div>
  </div>
));

// Extracted Individual Bills Table
const IndividualBillsTable = React.memo(({ studentData, hasFinalizedBill }) => {
  return (
    <div className="p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Individual Bills {hasFinalizedBill && "(Finalized Selection)"}
      </h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Fee Description
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Original Amount
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Final Amount
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {studentData.bills.map((bill) => {
              const isSelected = hasFinalizedBill ? bill.isSelected : true;
              const hasCustomAmount =
                hasFinalizedBill &&
                bill.finalAmount !== undefined &&
                bill.finalAmount !== bill.originalAmount;
              const displayAmount = hasFinalizedBill
                ? bill.finalAmount
                : parseFloat(bill.amount);
              const originalAmount =
                bill.originalAmount || parseFloat(bill.amount);

              return (
                <tr
                  key={bill.id}
                  className={!isSelected ? "opacity-50 bg-gray-50" : ""}
                >
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-900">
                      {bill.category_name}
                      {!isSelected && (
                        <span className="ml-2 text-xs text-red-500">
                          (Not Selected)
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {bill.description}
                    </div>
                    {hasCustomAmount && (
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        ✏️ Custom amount applied
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    Ghc {originalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {isSelected ? (
                      <span className="text-gray-900">
                        Ghc {displayAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <CalendarIcon className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-gray-600">
                        {new Date(bill.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        bill.is_compulsory
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {bill.is_compulsory ? "Compulsory" : "Optional"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                      {bill.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Extracted Student Card Actions
const StudentCardActions = React.memo(
  ({
    studentData,
    hasFinalizedBill,
    handlePreviewBill,
    handleReceivePayment,
  }) => {
    return (
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          {hasFinalizedBill && studentData.finalizedBill && (
            <FinalizedBillStatus finalizedBill={studentData.finalizedBill} />
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreviewBill(studentData);
            }}
            className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            <span>Preview Bill</span>
          </button>
          {studentData.status !== "Paid" && (
            <button
              onClick={() => handleReceivePayment(studentData)}
              className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition-colors"
            >
              <BanknotesIcon className="w-4 h-4" />
              <span>
                {hasFinalizedBill ? "Receive Payment" : "Finalize Bill"}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }
);

// Extracted Finalized Bill Status
const FinalizedBillStatus = React.memo(({ finalizedBill }) => (
  <div className="flex items-center space-x-2 text-green-700">
    <DocumentCheckIcon className="w-4 h-4" />
    <span className="text-sm font-medium">Bill Finalized</span>
    <span className="text-xs text-gray-500">
      • Updated:{" "}
      {new Date(
        finalizedBill.updated_at || finalizedBill.created_at
      ).toLocaleDateString()}
    </span>
  </div>
));

// Extracted Empty State
const EmptyState = React.memo(
  ({
    hasActiveFilters,
    clearAllFilters,
    filters,
    generateBillsFromTemplates,
  }) => (
    <div className="text-center py-12 bg-gray-50 rounded-lg border">
      <DocumentArrowDownIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Student Bills Found
      </h3>
      <p className="text-gray-500 mb-4">
        {hasActiveFilters
          ? "No bills match your current filters."
          : "No student bills have been generated yet."}
      </p>
      {hasActiveFilters ? (
        <button
          onClick={clearAllFilters}
          className="inline-flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
          <span>Clear Filters</span>
        </button>
      ) : (
        filters.class_id &&
        filters.academic_year_id &&
        filters.term_id && (
          <button
            onClick={generateBillsFromTemplates}
            className="inline-flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Generate Bills from Templates</span>
          </button>
        )
      )}
    </div>
  )
);

export default StudentBills;