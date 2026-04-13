import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeftIcon,
  BanknotesIcon,
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CalculatorIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import PaymentHistory from "../../components/payment-history/PaymentHistoy";
import useDebounce from "../../hooks/useDebounce";
import api from "../../components/axiosconfig/axiosConfig";
import { useAuth } from "../contexts/AuthContext";

const ReceivePayment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();

  // States
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentBills, setStudentBills] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [allocations, setAllocations] = useState({});
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedClass, setSelectedClass] = useState("");
  const [billsLoading, setBillsLoading] = useState(false);
  const [arrearsTotal, setArrearsTotal] = useState(0);
  const [overpaymentsTotal, setOverpaymentsTotal] = useState(0);
  const [finalizedBill, setFinalizedBill] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [billDescriptions, setBillDescriptions] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load data on component mount
  useEffect(() => {
    fetchInitialData();

    // Check if student was passed from previous page WITH BILLS DATA
    if (location.state?.studentId) {
      const studentData = {
        id: location.state.studentId,
        ...location.state.studentInfo,
        finalizedBill: location.state.finalizedBill,
      };

      setSelectedStudent(studentData);
      setFinalizedBill(location.state.finalizedBill);

      // If bills data is passed from Student Bills page, use it
      if (location.state.selectedBills) {
        const bills = location.state.selectedBills;
        setStudentBills(bills);

        // Calculate total from finalized bill
        const totalDue =
          location.state.finalizedBill?.remaining_balance ||
          location.state.finalizedBill?.total_amount ||
          location.state.totals?.total ||
          bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);

        setPaymentAmount(totalDue);

        // Initialize allocations
        const initialAllocations = {};
        bills.forEach((bill) => {
          initialAllocations[bill.id] = 0;
        });
        setAllocations(initialAllocations);
        setRemainingBalance(totalDue);
      } else {
        // If no bills passed, fetch them
        handleStudentSelect(location.state.studentId);
      }
    }
  }, [location]);

  // Memoized helper functions
  const getCorrectBillAmount = useCallback((bill, finalizedBill) => {
    if (!bill) return 0;

    if (finalizedBill && finalizedBill.selected_bills) {
      try {
        const selectedBillsData =
          typeof finalizedBill.selected_bills === "string"
            ? JSON.parse(finalizedBill.selected_bills)
            : finalizedBill.selected_bills;

        if (
          selectedBillsData.edited_amounts &&
          selectedBillsData.edited_amounts[bill.id]
        ) {
          return parseFloat(selectedBillsData.edited_amounts[bill.id]) || 0;
        }
      } catch (error) {
        console.error("Error parsing selected_bills:", error);
      }
    }

    return parseFloat(bill.amount || 0);
  }, []);

  const getRemainingAmount = useCallback(
    (bill, finalizedBill) => {
      const totalAmount = getCorrectBillAmount(bill, finalizedBill);
      const paidAmount = parseFloat(bill.paid_amount || 0);
      const remaining = totalAmount - paidAmount;
      return Math.max(remaining, 0);
    },
    [getCorrectBillAmount],
  );

  const fetchInitialData = useCallback(async () => {
    try {
      const [classesRes, usersRes] = await Promise.all([
        api.get("/getclasses"),
        api.get("/getusers"),
      ]);

      setClasses(classesRes.data);
      setReceivedBy(usersRes.data[0]?.id || "");

      setLoading(false);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      alert("Error loading data");
      setLoading(false);
    }
  }, []);

  // OPTIMIZED: Fetch students with caching and better error handling
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) {
      alert("Please select a class first");
      return;
    }

    // Check if students are already loaded for this class
    if (students.length > 0 && selectedClass === students[0]?.class_id) {
      alert("Students already loaded for this class");

      return;
    }

    setLoadingStudents(true);
    try {
      // Try the new endpoint first
      const response = await api.get(
        `/getstudentsbyclass?class_id=${selectedClass}`,
      );

      if (response.data.length === 0) {
        alert(`No active students found in the selected class.`);
      }

      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);

      // Fallback logic
      if (error.response?.status === 404) {
        try {
          const fallbackResponse = await api.get(
            `/getstudents?class_id=${selectedClass}&includeInactive=false`,
          );
          setStudents(fallbackResponse.data);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          alert("Unable to load students. Please try again.");
        }
      } else {
        console.error("Network error:", error.message);
        alert("Network error. Please check your connection.");
      }
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClass, students]);

  // OPTIMIZED: Memoized filtered students with debounced search
  const filteredStudents = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return students;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    return students.filter((student) => {
      const fullName = `${student.first_name || ""} ${
        student.last_name || ""
      }`.toLowerCase();
      const admissionNumber = (student.admission_number || "").toLowerCase();
      const className = (student.class_name || "").toLowerCase();

      return (
        fullName.includes(searchLower) ||
        admissionNumber.includes(searchLower) ||
        className.includes(searchLower)
      );
    });
  }, [students, debouncedSearchTerm]);

  const handleStudentSelect = useCallback(
    async (studentId) => {
      setBillsLoading(true);
      setPaymentError("");
      setStudentBills([]);
      setAllocations({});
      setBillDescriptions({});
      setPaymentAmount(0);
      setRemainingBalance(0);
      setFinalizedBill(null);

      try {
        const student = students.find((s) => s.id === studentId);
        if (!student) {
          alert("Student not found in the list");
          return;
        }

        setSelectedStudent(student);

        // Fetch academic context
        const [currentYearRes, currentTermRes] = await Promise.all([
          api.get("/getacademicyears"),
          api.get("/getterms"),
        ]);

        const currentYear = currentYearRes.data.find((year) => year.is_current);
        const today = new Date();
        const currentTerm = currentTermRes.data.find((term) => {
          const start = new Date(term.start_date);
          const end = new Date(term.end_date);
          return today >= start && today <= end;
        });

        const academicYearId = currentYear?.id;
        const termId = currentTerm?.id;

        if (!academicYearId || !termId) {
          alert("No current academic year or term found");
          setBillsLoading(false);
          return;
        }

        let finalizedBillData = null;
        let billsToDisplay = [];
        let totalDue = 0;

        try {
          // Try to get finalized bill
          const termBillRes = await api.get(
            `/getstudenttermbill/${studentId}?academic_year_id=${academicYearId}&term_id=${termId}`,
          );
          finalizedBillData = termBillRes.data;
          setFinalizedBill(finalizedBillData);

          // GET STUDENT BILLS USING YOUR CORRECT ENDPOINT
          const billsRes = await api.get(
            `/getstudentbills?student_id=${studentId}&academic_year_id=${academicYearId}&term_id=${termId}`,
          );

          // Based on your code, bills are in response.data.bills
          const allBills = billsRes.data?.bills || [];

          // Extract selected bills from finalized bill
          if (finalizedBillData.selected_bills) {
            const selectedBillsData =
              typeof finalizedBillData.selected_bills === "string"
                ? JSON.parse(finalizedBillData.selected_bills)
                : finalizedBillData.selected_bills;

            const selectedBillIds = selectedBillsData.bill_ids || [];
            const editedAmounts = selectedBillsData.edited_amounts || {};

            // Filter to show ONLY SELECTED BILLS from finalized bill
            billsToDisplay = allBills
              .filter((bill) => selectedBillIds.includes(bill.id))
              .map((bill) => {
                let finalAmount = parseFloat(bill.amount || 0);

                // Apply edited amount if it exists
                if (editedAmounts[bill.id] !== undefined) {
                  finalAmount = parseFloat(editedAmounts[bill.id]);
                }
                // Check for finalized_amount from your API response
                else if (bill.finalized_amount) {
                  finalAmount = parseFloat(bill.finalized_amount);
                }

                return {
                  ...bill,
                  amount: finalAmount,
                  finalAmount: finalAmount,
                  has_custom_amount:
                    editedAmounts[bill.id] !== undefined ||
                    bill.finalized_amount !== undefined,
                  paid_amount: bill.paid_amount || 0,
                  remaining_amount:
                    finalAmount - (parseFloat(bill.paid_amount) || 0),
                };
              });

            totalDue =
              parseFloat(finalizedBillData.remaining_balance) ||
              parseFloat(finalizedBillData.total_amount);
          } else {
            // If finalized bill exists but no selected_bills, show nothing
            billsToDisplay = [];
            totalDue = 0;
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // NO FINALIZED BILL - SHOW NOTHING IN ALLOCATION TABLE
            setPaymentError(
              "Student does not have a finalized bill. Please finalize the bill first to view and allocate payments.",
            );
            billsToDisplay = []; // Empty array - no bills to show
            totalDue = 0;
          } else {
            throw error;
          }
        }

        setStudentBills(billsToDisplay);
        setPaymentAmount(Math.max(totalDue, 0));
        setRemainingBalance(Math.max(totalDue, 0));

        // Initialize allocations and descriptions ONLY for displayed bills
        const initialAllocations = {};
        const initialDescriptions = {};

        billsToDisplay.forEach((bill) => {
          initialAllocations[bill.id] = 0;
          initialDescriptions[bill.id] =
            bill.description || bill.category_name || "Fee Payment";
        });

        setAllocations(initialAllocations);
        setBillDescriptions(initialDescriptions);
      } catch (error) {
        console.error("Error fetching student data:", error);
        alert(
          "Error loading student bills information: " +
            (error.response?.data?.error || error.message),
        );
      } finally {
        setBillsLoading(false);
      }
    },
    [students],
  );

  const handleAllocationChange = useCallback(
    (billId, amount, maxAllocation) => {
      const numAmount = parseFloat(amount) || 0;
      const validAmount = Math.min(Math.max(0, numAmount), maxAllocation);

      setAllocations((prev) => ({
        ...prev,
        [billId]: validAmount,
      }));

      const totalAllocated = Object.values({
        ...allocations,
        [billId]: validAmount,
      }).reduce((sum, alloc) => sum + alloc, 0);

      setRemainingBalance(paymentAmount - totalAllocated);
    },
    [allocations, paymentAmount],
  );

  // Memoized description change handler
  const handleDescriptionChange = useCallback((billId, description) => {
    setBillDescriptions((prev) => ({
      ...prev,
      [billId]: description,
    }));
  }, []);

  // Pro-rata allocation
  const allocateProRata = useCallback(() => {
    if (paymentAmount <= 0 || studentBills.length === 0) return;

    const billsWithBalance = studentBills.filter((bill) => {
      const remaining = getRemainingAmount(bill, finalizedBill);
      return remaining > 0;
    });

    if (billsWithBalance.length === 0) return;

    const totalDue = billsWithBalance.reduce(
      (sum, bill) => sum + getRemainingAmount(bill, finalizedBill),
      0,
    );

    const newAllocations = {};
    studentBills.forEach((bill) => {
      newAllocations[bill.id] = 0;
    });

    billsWithBalance.forEach((bill) => {
      const billRemaining = getRemainingAmount(bill, finalizedBill);
      const allocatedAmount = (billRemaining / totalDue) * paymentAmount;
      newAllocations[bill.id] = Math.min(allocatedAmount, billRemaining);
    });

    setAllocations(newAllocations);
    setRemainingBalance(0);
  }, [paymentAmount, studentBills, finalizedBill, getRemainingAmount]);

  // Allocate to oldest bills
  const allocateToOldest = useCallback(() => {
    if (paymentAmount <= 0 || studentBills.length === 0) return;

    const billsWithBalance = studentBills
      .filter((bill) => {
        const remaining = getRemainingAmount(bill, finalizedBill);
        return remaining > 0;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    if (billsWithBalance.length === 0) return;

    const newAllocations = {};
    studentBills.forEach((bill) => {
      newAllocations[bill.id] = 0;
    });

    let remainingPayment = paymentAmount;
    billsWithBalance.forEach((bill) => {
      if (remainingPayment > 0) {
        const billRemaining = getRemainingAmount(bill, finalizedBill);
        const allocate = Math.min(billRemaining, remainingPayment);
        newAllocations[bill.id] = allocate;
        remainingPayment -= allocate;
      }
    });

    setAllocations(newAllocations);
    setRemainingBalance(remainingPayment);
  }, [paymentAmount, studentBills, finalizedBill, getRemainingAmount]);

  // Clear allocations
  const clearAllocations = useCallback(() => {
    const clearedAllocations = {};
    studentBills.forEach((bill) => {
      clearedAllocations[bill.id] = 0;
    });
    setAllocations(clearedAllocations);
    setRemainingBalance(paymentAmount);
  }, [studentBills, paymentAmount]);

  // Download receipt
  const downloadReceipt = useCallback(async (receiptNumber) => {
    try {
      const response = await api.get(`/receipts/${receiptNumber}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Error downloading receipt. Please try again.");
    }
  }, []);

  // Process payment
  const processPayment = useCallback(async () => {
    if (!selectedStudent) {
      alert("Please select a student");
      return;
    }

    if (paymentAmount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (paymentMethod !== "Cash" && !referenceNumber) {
      alert("Reference number is required for non-cash payments");
      return;
    }

    if (!finalizedBill) {
      alert(
        "Student does not have a finalized bill. Please finalize the bill first.",
      );
      return;
    }

    const remainingBalance =
      parseFloat(finalizedBill.remaining_balance) ||
      parseFloat(finalizedBill.total_amount);

    if (paymentAmount > remainingBalance) {
      alert(
        `Payment amount (Ghc ${paymentAmount}) exceeds remaining balance (Ghc ${remainingBalance.toFixed(
          2,
        )})`,
      );
      return;
    }

    setProcessing(true);
    setPaymentError("");

    try {
      const receivedBy = user.id || 1;
      const paymentData = {
        student_id: selectedStudent.id,
        amount_paid: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        received_by: parseInt(receivedBy),
        notes: notes,
        allocations: allocations,
        bill_descriptions: billDescriptions,
      };

      const response = await api.post("/processpayment", paymentData);

      if (response.data.success) {
        const receiptNumber = response.data.receipt.receipt_number;
        setNotification({
          type: "success",
          title: "Payment Successful!",
          message: `Amount: Ghc ${paymentAmount.toFixed(2)}`,
          receipt: receiptNumber,
          email: response.data.email,
        });
        setTimeout(() => setNotification(null), 10000);
        if (
          window.confirm(
            `Payment processed successfully!\n\n` +
              `Receipt Number: ${receiptNumber}\n` +
              `Amount: Ghc ${paymentAmount.toFixed(2)}\n\n` +
              `Would you like to download the receipt now?`,
          )
        ) {
          await downloadReceipt(receiptNumber);
        }

        if (response.data.balance) {
          setFinalizedBill((prev) => ({
            ...prev,
            paid_amount: (parseFloat(prev.paid_amount) || 0) + paymentAmount,
            remaining_balance: response.data.balance.new_balance,
            is_fully_paid: response.data.balance.is_fully_paid,
          }));
        }

        setTimeout(() => {
          navigate("/finance/student-bills");
        }, 2000);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error.response?.data?.error || error.message;
      setPaymentError(errorMessage);
      alert("Error processing payment: " + errorMessage);
    } finally {
      setProcessing(false);
    }
  }, [
    selectedStudent,
    paymentAmount,
    paymentMethod,
    referenceNumber,
    finalizedBill,
    paymentDate,
    receivedBy,
    notes,
    allocations,
    billDescriptions,
    downloadReceipt,
    navigate,
  ]);

  // Handle class change
  const handleClassChange = useCallback((e) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    setStudents([]);
    setSelectedStudent(null);
    setSearchTerm("");
  }, []);

  // Memoized total allocated amount
  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((sum, alloc) => sum + alloc, 0),
    [allocations],
  );

  // Memoized payment validation
  const canProcessPayment = useMemo(() => {
    if (!selectedStudent || paymentAmount <= 0 || processing) return false;
    if (!finalizedBill || parseFloat(finalizedBill.remaining_balance) <= 0)
      return false;
    if (remainingBalance !== 0) return false;
    if (paymentAmount > parseFloat(finalizedBill.remaining_balance))
      return false;

    // Check allocations don't exceed individual bill remaining amounts
    return Object.entries(allocations).every(([billId, amount]) => {
      if (amount === 0) return true;
      const bill = studentBills.find((b) => b.id == billId);
      if (!bill) return false;
      const billRemaining = getRemainingAmount(bill, finalizedBill);
      return amount <= billRemaining;
    });
  }, [
    selectedStudent,
    paymentAmount,
    remainingBalance,
    finalizedBill,
    allocations,
    studentBills,
    getRemainingAmount,
    processing,
  ]);

  if (loading) {
    return <LoadingSpinner text="Loading payment page..." />;
  }

  // Extract Student List Component
  const StudentList = () => {
    if (students.length === 0 && selectedClass) {
      return (
        <div className="text-center py-4 text-gray-500">
          {loadingStudents ? (
            <div className="flex items-center justify-center space-x-2">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Loading students...</span>
            </div>
          ) : (
            "Click 'Load Students' to load students from selected class"
          )}
        </div>
      );
    }

    if (filteredStudents.length === 0 && searchTerm) {
      return (
        <div className="text-center py-4 text-gray-500">
          No students found matching "{searchTerm}"
        </div>
      );
    }

    return (
      <div className="mt-4 max-h-60 overflow-y-auto">
        {filteredStudents.map((student) => (
          <StudentListItem
            key={student.id}
            student={student}
            isSelected={selectedStudent?.id === student.id}
            onClick={() => handleStudentSelect(student.id)}
          />
        ))}
      </div>
    );
  };

  // Extract Student List Item Component
  const StudentListItem = React.memo(({ student, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className={`p-3 border rounded mb-2 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50 border-blue-300 border-2" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {student.first_name} {student.last_name}
          </h3>
          <p className="text-sm text-gray-600">{student.admission_number}</p>
          <p className="text-xs text-gray-500">{student.class_name}</p>
        </div>
        {isSelected && (
          <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
        )}
      </div>
    </div>
  ));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            notification.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-700 border border-yellow-200"
          }`}
        >
          <div className="flex items-start">
            {notification.type === "success" ? (
              <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
            )}
            <div>
              <h3 className="font-semibold">{notification.title}</h3>
              <p className="text-sm">{notification.message}</p>
              {notification.receipt && (
                <p className="text-xs text-gray-600 mt-1">
                  Receipt: {notification.receipt}
                </p>
              )}
              {notification.email && (
                <p className="text-xs mt-2">
                  {notification.email.sent ? (
                    <span className="text-green-600">
                      ✅ Email sent to {notification.email.recipient}
                    </span>
                  ) : (
                    <span className="text-red-700 text-xl ">
                      ⚠️ "Mail Sent"
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/finance/student-bills")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Student Bills</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Receive Payment
            </h1>
            <p className="text-gray-600">
              Process student fee payments against finalized bills
            </p>
          </div>
        </div>
      </div>

      {/* Payment Error Alert */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-semibold text-red-800">Payment Error</span>
          </div>
          <div className="text-sm text-red-700 mt-1">{paymentError}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Selection & Payment Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Selection */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
              Select Student
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={handleClassChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClass && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Search Student
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, admission number, or class..."
                        className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={fetchStudents}
                    disabled={loadingStudents}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
                  >
                    {loadingStudents ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : students.length > 0 ? (
                      "Refresh Students"
                    ) : (
                      "Load Students"
                    )}
                  </button>
                </>
              )}
            </div>

            <StudentList />

            {/* Student Count */}
            {students.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Showing {filteredStudents.length} of {students.length} students
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <BanknotesIcon className="w-5 h-5 mr-2 text-green-500" />
              Payment Details
            </h2>

            <div className="space-y-4">
              {finalizedBill && (
                <FinalizedBillBalance finalizedBill={finalizedBill} />
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Amount (Ghc)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => {
                    const newAmount = parseFloat(e.target.value) || 0;
                    setPaymentAmount(newAmount);
                    setRemainingBalance(newAmount - totalAllocated);
                  }}
                  className="w-full border p-2 rounded"
                  min="0"
                  step="0.01"
                  max={
                    finalizedBill
                      ? parseFloat(finalizedBill.remaining_balance) ||
                        parseFloat(finalizedBill.total_amount)
                      : undefined
                  }
                />
                {finalizedBill && (
                  <div className="text-xs text-gray-500 mt-1">
                    Max: Ghc{" "}
                    {(
                      parseFloat(finalizedBill.remaining_balance) ||
                      parseFloat(finalizedBill.total_amount)
                    ).toFixed(2)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Check">Check</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Reference Number{" "}
                  {paymentMethod !== "Cash" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder={
                    paymentMethod === "Cash" ? "Optional" : "Required"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border p-2 rounded"
                  rows="3"
                  placeholder="Additional notes about this payment..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Bill Allocation */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CalculatorIcon className="w-5 h-5 mr-2 text-purple-500" />
              Allocate Payment to Bills
            </h2>

            {finalizedBill ? (
              <FinalizedBillNotice />
            ) : (
              <NoFinalizedBillNotice />
            )}

            {/* Allocation Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600 font-medium mb-1">
                      Total Amount
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      Ghc{" "}
                      {finalizedBill
                        ? parseFloat(finalizedBill.total_amount).toFixed(2)
                        : "0.00"}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-green-600 font-medium mb-1">
                      Amount Paid
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      Ghc{" "}
                      {finalizedBill
                        ? parseFloat(finalizedBill.paid_amount || 0).toFixed(2)
                        : "0.00"}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-purple-600 font-medium mb-1">
                      Remaining Balance
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        finalizedBill && finalizedBill.remaining_balance > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      Ghc{" "}
                      {finalizedBill
                        ? parseFloat(
                            finalizedBill.remaining_balance || 0,
                          ).toFixed(2)
                        : "0.00"}
                      {finalizedBill &&
                        finalizedBill.remaining_balance <= 0 &&
                        " (Fully Paid)"}
                    </div>
                  </div>
                </div>

                <div className="border-l pl-4">
                  <div className="text-sm font-semibold mb-2">
                    Payment Status
                  </div>
                  <div className="space-y-2 text-xs">
                    {finalizedBill ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-green-600">
                            Finalized Bill:
                          </span>
                          <span className="font-medium">Ready</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Can Accept Payment:</span>
                          <span
                            className={`font-medium ${
                              finalizedBill.remaining_balance > 0
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {finalizedBill.remaining_balance > 0
                              ? "Yes"
                              : "Fully Paid"}
                          </span>
                        </div>
                        {finalizedBill.remaining_balance <= 0 && (
                          <div className="text-green-600 bg-green-50 p-2 rounded text-center">
                            ✅ Student has fully paid all fees
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-red-600 bg-red-50 p-2 rounded text-center">
                        ❌ Bill not finalized
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-allocation Buttons */}
            {finalizedBill && studentBills.length > 0 && (
              <>
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={allocateProRata}
                    className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                    title="Distribute payment evenly among unpaid bills"
                  >
                    Distribute to Unpaid Bills
                  </button>
                  <button
                    onClick={allocateToOldest}
                    className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
                    title="Pay oldest unpaid bills first"
                  >
                    Pay Oldest Unpaid First
                  </button>
                  <button
                    onClick={clearAllocations}
                    className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                  >
                    Clear All
                  </button>
                </div>

                {/* Bills Allocation Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left font-medium">
                          Bill Description
                        </th>
                        <th className="p-3 text-right font-medium">Due Date</th>
                        <th className="p-3 text-right font-medium">
                          Amount Due
                        </th>
                        <th className="p-3 text-right font-medium">Paid</th>
                        <th className="p-3 text-right font-medium">
                          Remaining
                        </th>
                        <th className="p-3 text-right font-medium">Allocate</th>
                        <th className="p-3 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentBills.map((bill) => (
                        <BillRow
                          key={bill.id}
                          bill={bill}
                          finalizedBill={finalizedBill}
                          allocations={allocations}
                          billDescriptions={billDescriptions}
                          handleAllocationChange={handleAllocationChange}
                          handleDescriptionChange={handleDescriptionChange}
                          getCorrectBillAmount={getCorrectBillAmount}
                          getRemainingAmount={getRemainingAmount}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!finalizedBill && (
              <NoBillsAvailable
                selectedStudent={selectedStudent}
                navigate={navigate}
              />
            )}

            {/* Process Payment Button */}
            <div className="mt-6 flex justify-end space-x-4">
              {finalizedBill && finalizedBill.remaining_balance <= 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <CheckIcon className="w-5 h-5" />
                    <span className="font-semibold">All Fees Fully Paid</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    No payment required - student has zero balance
                  </p>
                </div>
              ) : (
                <button
                  onClick={processPayment}
                  disabled={!canProcessPayment}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing
                    ? "Processing Payment..."
                    : `Process Payment of Ghc ${paymentAmount.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      {selectedStudent && (
        <PaymentHistory
          studentId={selectedStudent?.id}
          academicContext={{
            academic_year_id: finalizedBill?.academic_year_id,
            term_id: finalizedBill?.term_id,
          }}
        />
      )}
    </div>
  );
};

// Extracted Components for better performance

const FinalizedBillBalance = React.memo(({ finalizedBill }) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
    <div className="flex items-center mb-2">
      <DocumentCheckIcon className="w-4 h-4 text-green-600 mr-2" />
      <span className="font-semibold text-green-800">Finalized Bill</span>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-gray-600">Total:</span>
        <div className="font-semibold">
          Ghc {parseFloat(finalizedBill.total_amount).toFixed(2)}
        </div>
      </div>
      <div>
        <span className="text-gray-600">Paid:</span>
        <div className="font-semibold text-blue-600">
          Ghc {parseFloat(finalizedBill.paid_amount || 0).toFixed(2)}
        </div>
      </div>
      <div className="col-span-2">
        <span className="text-gray-600">Remaining:</span>
        <div
          className={`font-bold text-lg ${
            finalizedBill.remaining_balance > 0
              ? "text-red-600"
              : finalizedBill.remaining_balance < 0
                ? "text-green-600"
                : "text-gray-600"
          }`}
        >
          Ghc {Math.abs(finalizedBill.remaining_balance || 0).toFixed(2)}
          {finalizedBill.remaining_balance > 0
            ? " Due"
            : finalizedBill.remaining_balance < 0
              ? " Credit"
              : " Paid"}
        </div>
      </div>
    </div>
  </div>
));

const FinalizedBillNotice = React.memo(() => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <DocumentCheckIcon className="w-5 h-5 text-green-600 mr-2" />
      <span className="font-semibold text-green-800">
        Finalized Bill Payment
      </span>
    </div>
    <div className="text-sm text-green-700 mt-1">
      Payment will be applied to the finalized bill total. Bill allocations are
      for reporting purposes only.
    </div>
  </div>
));

const NoFinalizedBillNotice = React.memo(() => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <div className="flex items-center">
      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
      <span className="font-semibold text-yellow-800">No Finalized Bill</span>
    </div>
    <div className="text-sm text-yellow-700 mt-1">
      Student does not have a finalized bill. Please finalize the bill first
      before processing payments.
    </div>
  </div>
));

const BillRow = React.memo(
  ({
    bill,
    finalizedBill,
    allocations,
    billDescriptions,
    handleAllocationChange,
    handleDescriptionChange,
    getCorrectBillAmount,
    getRemainingAmount,
  }) => {
    const totalBillAmount = getCorrectBillAmount(bill, finalizedBill);
    const paidSoFar = parseFloat(bill.paid_amount || 0);
    const remainingAmount = getRemainingAmount(bill, finalizedBill);
    const isFullyPaid = remainingAmount <= 0;
    const hasAllocation = allocations[bill.id] > 0;

    let isEditedAmount = false;
    let originalAmount = parseFloat(bill.amount || 0);

    if (finalizedBill && finalizedBill.selected_bills) {
      try {
        const selectedBillsData =
          typeof finalizedBill.selected_bills === "string"
            ? JSON.parse(finalizedBill.selected_bills)
            : finalizedBill.selected_bills;

        if (
          selectedBillsData.edited_amounts &&
          selectedBillsData.edited_amounts[bill.id]
        ) {
          isEditedAmount = true;
        }
      } catch (error) {
        console.error("Error checking edited amounts:", error);
      }
    }

    const currentDescription =
      billDescriptions[bill.id] || bill.description || bill.category_name;

    return (
      <tr
        className={`border-b ${
          isFullyPaid ? "bg-green-50" : "hover:bg-gray-50"
        }`}
      >
        <td className="p-3">
          <div
            className={`font-medium ${
              isFullyPaid ? "text-green-700" : "text-gray-900"
            }`}
          >
            {bill.category_name}
            {isFullyPaid && (
              <span className="ml-2 text-xs text-green-600">(Paid)</span>
            )}
          </div>

          {isEditedAmount && !isFullyPaid && (
            <div className="text-xs text-purple-600 font-medium mt-1">
              Custom amount: {originalAmount.toFixed(2)} →{" "}
              {totalBillAmount.toFixed(2)}
            </div>
          )}

          {hasAllocation && !isFullyPaid ? (
            <div className="mt-2">
              <input
                type="text"
                value={currentDescription}
                onChange={(e) =>
                  handleDescriptionChange(bill.id, e.target.value)
                }
                placeholder="Enter payment description..."
                className="w-full text-xs border border-blue-300 p-2 rounded bg-blue-50 focus:bg-white focus:border-blue-500"
                maxLength="100"
              />
              <div className="text-xs text-gray-500 mt-1">
                This description will appear on the receipt
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-1">
              {currentDescription}
              {isFullyPaid && (
                <span className="ml-1 text-green-600">✓ Paid</span>
              )}
            </div>
          )}
        </td>

        <td className="p-3 text-right">
          {new Date(bill.due_date).toLocaleDateString()}
        </td>

        <td className="p-3 text-right font-medium">
          Ghc {totalBillAmount.toFixed(2)}
          {isEditedAmount && (
            <div className="text-xs text-purple-500">(Finalized amount)</div>
          )}
        </td>

        <td className="p-3 text-right text-green-600">
          Ghc {paidSoFar.toFixed(2)}
        </td>

        <td className="p-3 text-right font-medium text-red-600">
          Ghc {remainingAmount.toFixed(2)}
        </td>

        <td className="p-3">
          <input
            type="number"
            value={allocations[bill.id] || 0}
            onChange={(e) => {
              const amount = parseFloat(e.target.value) || 0;
              handleAllocationChange(bill.id, amount, remainingAmount);

              if (amount === 0 && billDescriptions[bill.id]) {
                handleDescriptionChange(bill.id, "");
              }
            }}
            className={`w-24 border p-1 rounded text-right ${
              isFullyPaid ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            min="0"
            max={remainingAmount}
            step="0.01"
            disabled={isFullyPaid}
          />
          {!isFullyPaid && (
            <div className="text-xs text-gray-500 mt-1">
              Max: Ghc {remainingAmount.toFixed(2)}
            </div>
          )}
        </td>

        <td className="p-3 text-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isFullyPaid
                ? "bg-green-100 text-green-800"
                : paidSoFar > 0
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {isFullyPaid
              ? "✅ Paid"
              : paidSoFar > 0
                ? "💰 Partial"
                : "⏳ Pending"}
          </span>
        </td>
      </tr>
    );
  },
);

const NoBillsAvailable = React.memo(({ selectedStudent, navigate }) => (
  <div className="text-center py-8 text-gray-500">
    <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
    <p>No finalized bill available for payment</p>
    {selectedStudent && (
      <button
        onClick={() =>
          navigate("/finance/select-bills", {
            state: {
              studentId: selectedStudent?.id,
              studentInfo: selectedStudent,
            },
          })
        }
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Finalize Bill First
      </button>
    )}
  </div>
));

export default ReceivePayment;
