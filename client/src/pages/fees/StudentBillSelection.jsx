import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../components/axiosconfig/axiosConfig";

const StudentBillSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentBills, setStudentBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [editedAmounts, setEditedAmounts] = useState({}); // New state for edited amounts
  const [editingBillId, setEditingBillId] = useState(null); // Track which bill is being edited
  const [warningType, setWarningType] = useState("compulsory_deselected");
  const [studentOverpayments, setStudentOverpayments] = useState([]);
  const [studentArrears, setStudentArrears] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasPayments, setHasPayments] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [academicContext, setAcademicContext] = useState(null);
  const [finalizedBill, setFinalizedBill] = useState(null);
  const [showAddBillsModal, setShowAddBillsModal] = useState(false);
  const [availableOptionalBills, setAvailableOptionalBills] = useState([]);
  const [selectedNewBills, setSelectedNewBills] = useState([]);
  const [editedNewBillAmounts, setEditedNewBillAmounts] = useState({});
  const [editingNewBillId, setEditingNewBillId] = useState(null);

  // Get student_id from URL params or location state
  const queryParams = new URLSearchParams(location.search);
  const studentId = queryParams.get("student_id") || location.state?.studentId;

  useEffect(() => {
    if (studentId) {

      // Get academic context from navigation state or URL params
      const passedAcademicContext = location.state?.academicContext;

      if (passedAcademicContext) {
        setAcademicContext(passedAcademicContext);

        // Fetch with the passed context
        fetchStudentBills(passedAcademicContext);
        checkExistingTermBill(passedAcademicContext);
        checkExistingPayments(passedAcademicContext);
      } else {
        // Fallback: try URL params
        const urlAcademicYearId = queryParams.get("academic_year_id");
        const urlTermId = queryParams.get("term_id");

        if (urlAcademicYearId && urlTermId) {
          const context = {
            academic_year_id: urlAcademicYearId,
            term_id: urlTermId,
            class_id: queryParams.get("class_id"),
          };
          setAcademicContext(context);

          fetchStudentBills(context);
          checkExistingTermBill(context);
          checkExistingPayments(context);
        } else {
          // Fallback: get current academic context
          fetchCurrentAcademicContext();
        }
      }

      fetchStudentBalances();
    } else {
      alert("No student selected");
      navigate("/finance/student-bills");
    }
  }, [studentId, location.state]);

  const fetchCurrentAcademicContext = async () => {
    try {
      const [yearsRes, termsRes] = await Promise.all([
        api.get("/getacademicyears"),
        api.get("/getterms"),
      ]);

      const currentYear = yearsRes.data.find((year) => year.is_current);
      const today = new Date();
      const currentTerm = termsRes.data.find((term) => {
        const start = new Date(term.start_date);
        const end = new Date(term.end_date);
        return today >= start && today <= end;
      });

      const context = {
        academic_year_id: currentYear?.id,
        term_id: currentTerm?.id,
      };

      setAcademicContext(context);
    } catch (error) {
      console.error("Error fetching academic context:", error);
    }
  };

  const fetchStudentBalances = async () => {
    try {
      const [arrearsRes, overpaymentsRes] = await Promise.all([
        api.get(
          `/getstudentarrears/${studentId}`
        ),
        api.get(
          `/getstudentoverpayments/${studentId}`
        ),
      ]);

      setStudentArrears(arrearsRes.data);
      setStudentOverpayments(
        overpaymentsRes.data.filter((op) => op.status === "Active")
      );
    } catch (error) {
      console.error("Error fetching student balances:", error);
    }
  };

  
  // Update fetchStudentBills function to use the context properly:
  const fetchStudentBills = async (academicContext = null) => {
    setLoading(true);
    try {
      // Use the provided academic context or fallback
      let context = academicContext;

      if (!context) {
        context = await getCurrentAcademicContext();
        setAcademicContext(context);
      }


      if (!context.academic_year_id || !context.term_id) {
        alert("Please select academic year and term first");
        return;
      }

      const response = await api.get(
        `/getstudentbills?student_id=${studentId}&academic_year_id=${context.academic_year_id}&term_id=${context.term_id}`
      );

      const bills = response.data?.bills || [];

      if (bills.length > 0) {
        const studentData = {
          name: `${bills[0].first_name} ${bills[0].last_name}`,
          admission_number: bills[0].admission_number,
          class_name: bills[0].class_name,
          academic_year_id: context.academic_year_id,
          term_id: context.term_id,
        };

        setStudentInfo(studentData);
        setStudentBills(bills);

        // Auto-select all bills initially if not finalized
        const allBillIds = bills.map((bill) => bill.id);
        setSelectedBills(allBillIds);
      } else {
        const studentData = {
          studentId,
          academic_year_id: context.academic_year_id,
          term_id: context.term_id,
        };

        // Try to get student info from another source
        await fetchStudentInfoFromOtherSource();
      }
    } catch (error) {
      console.error("Error fetching student bills:", error);
      alert("Error loading student bills for the selected term");
    }
    setLoading(false);
  };

  // Helper function to get student info
  const fetchStudentInfoFromOtherSource = async () => {
    try {
      const response = await api.get(
        `/getstudents?student_id=${studentId}`
      );

      if (response.data && response.data.length > 0) {
        const student = response.data[0];
        setStudentInfo({
          name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number,
          class_name: student.class_name,
          academic_year_id: academicContext?.academic_year_id,
          term_id: academicContext?.term_id,
        });
      }
    } catch (error) {
      console.error("Error fetching student info:", error);
    }
  };

  const getCurrentAcademicContext = async () => {
    try {
      const [yearsRes, termsRes] = await Promise.all([
        api.get("/getacademicyears"),
        api.get("/getterms"),
      ]);

      const currentYear = yearsRes.data.find((year) => year.is_current);
      const today = new Date();
      const currentTerm = termsRes.data.find((term) => {
        const start = new Date(term.start_date);
        const end = new Date(term.end_date);
        return today >= start && today <= end;
      });

      return {
        academic_year_id: currentYear?.id,
        term_id: currentTerm?.id,
      };
    } catch (error) {
      console.error("Error getting academic context:", error);
      return { academic_year_id: null, term_id: null };
    }
  };

  const fetchAvailableOptionalBills = async () => {
    try {
      if (!studentInfo || !academicContext) {
        alert("Academic context not available");
        return [];
      }

      const response = await api.get(
        `/get-available-bills?student_id=${studentId}&academic_year_id=${academicContext.academic_year_id}&term_id=${academicContext.term_id}`
      );

      setEditedNewBillAmounts({});
      setEditingNewBillId(null);
      return response.data.available_optional_bills || [];
    } catch (error) {
      console.error("Error fetching available optional bills:", error);
      return [];
    }
  };

  // Add this function to handle editing new bill amounts
  const handleNewBillAmountEdit = (billId, newAmount) => {
    setEditedNewBillAmounts((prev) => ({
      ...prev,
      [billId]: parseFloat(newAmount) || 0,
    }));
  };

  // Helper function to get display amount for new bills
  const getNewBillDisplayAmount = (bill) => {
    return editedNewBillAmounts[bill.id] !== undefined
      ? editedNewBillAmounts[bill.id]
      : parseFloat(bill.amount);
  };
  
  // Update the handleAddNewBills function
  const handleAddNewBills = async () => {
    if (selectedNewBills.length === 0) {
      alert("Please select at least one bill to add");
      return;
    }

    setSaving(true);
    try {
      // Prepare the data with edited amounts
      const editedAmountsPayload = {};
      const newBillIds = [];

      selectedNewBills.forEach((billId) => {
        const bill = availableOptionalBills.find((b) => b.id === billId);
        if (bill) {
          newBillIds.push(billId);
          editedAmountsPayload[billId] =
            editedNewBillAmounts[billId] !== undefined
              ? editedNewBillAmounts[billId]
              : parseFloat(bill.amount);
        }
      });

    

      const response = await api.post(
        "/add-bills-to-finalized",
        {
          student_id: studentId,
          academic_year_id: studentInfo.academic_year_id,
          term_id: studentInfo.term_id,
          new_bill_ids: newBillIds,
          edited_amounts: editedAmountsPayload, // Make sure this is sent
          created_by: 1,
        }
      );

      if (response.data.success) {
        // Update local state with the response data
        setFinalizedBill(response.data.term_bill);

        // Refresh the bills data
        await fetchStudentBills();

        // Update totals display
        alert(
          `Added ${response.data.added_bills_count} bills. Amount added: Ghc ${response.data.amount_added}`
        );

        // Clear the modal state
        setShowAddBillsModal(false);
        setSelectedNewBills([]);
        setEditedNewBillAmounts({});
        setEditingNewBillId(null);

        // Refresh the page data
        fetchStudentBills();
        checkExistingTermBill();
      }
    } catch (error) {
      console.error("Error adding new bills:", error);
      alert(error.response?.data?.error || "Failed to add new bills");
    }
    setSaving(false);
  };

  const checkExistingTermBill = async (academicContext = null) => {
    try {
      if (!studentId) return;

      const context = academicContext || (await getCurrentAcademicContext());

      if (!context.academic_year_id || !context.term_id) {
        return;
      }


      const response = await api.get(
        `/getstudenttermbill/${studentId}?academic_year_id=${context.academic_year_id}&term_id=${context.term_id}`
      );

      if (response.data) {
        setIsFinalized(true);

        // Store the finalized bill data
        setFinalizedBill(response.data);

        let selectedBillsData;
        if (typeof response.data.selected_bills === "string") {
          selectedBillsData = JSON.parse(response.data.selected_bills);
        } else {
          selectedBillsData = response.data.selected_bills;
        }

        setSelectedBills(selectedBillsData.bill_ids || []);

        if (selectedBillsData.edited_amounts) {
          setEditedAmounts(selectedBillsData.edited_amounts);
        }

        // CRITICAL: Check if there are actual payments
        const hasActualPayments = response.data.paid_amount > 0;
        

        if (hasActualPayments !== hasPayments) {
          setHasPayments(hasActualPayments);
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setIsFinalized(false);
        setFinalizedBill(null);
      } else {
        console.error("Error checking existing term bill:", error);
      }
    }
  };

  const checkExistingPayments = async (academicContext = null) => {
    try {
      if (!studentId) return;

      const context = academicContext || (await getCurrentAcademicContext());

      if (!context.academic_year_id || !context.term_id) {
        return;
      }


      const paymentsResponse = await api.get(
        `/checkstudentpayments/${studentId}?academic_year_id=${context.academic_year_id}&term_id=${context.term_id}`
      );

      // CRITICAL FIX: hasPayments should be true ONLY if there are payments for THIS SPECIFIC TERM
      setHasPayments(paymentsResponse.data.hasPayments);
    } catch (error) {
      console.error("Error checking payments:", error);
      // If there's an error, assume no payments
      setHasPayments(false);
    }
  };

  const handleBillSelection = (billId, isCompulsory, isSelected) => {
    if (isSelected) {
      setSelectedBills((prev) => prev.filter((id) => id !== billId));
    } else {
      setSelectedBills((prev) => [...prev, billId]);
    }
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    const allBillIds = studentBills.map((bill) => bill.id);
    setSelectedBills(allBillIds);
    setHasChanges(true);
  };

  const handleDeselectAll = () => {
    setSelectedBills([]);
    setHasChanges(true);
  };

  const handleSelectAllCompulsory = () => {
    const compulsoryBillIds = studentBills
      .filter((bill) => bill.is_compulsory)
      .map((bill) => bill.id);
    setSelectedBills((prev) => [...new Set([...prev, ...compulsoryBillIds])]);
    setHasChanges(true);
  };

  const handleDeselectAllCompulsory = () => {
    const optionalBillIds = studentBills
      .filter((bill) => !bill.is_compulsory)
      .map((bill) => bill.id);
    setSelectedBills(optionalBillIds);
    setHasChanges(true);
  };

  const handleSelectAllOptional = () => {
    const optionalBills = studentBills.filter((bill) => !bill.is_compulsory);
    const optionalBillIds = optionalBills.map((bill) => bill.id);
    setSelectedBills((prev) => [...new Set([...prev, ...optionalBillIds])]);
    setHasChanges(true);
  };

  const handleDeselectAllOptional = () => {
    const compulsoryBillIds = studentBills
      .filter((bill) => bill.is_compulsory)
      .map((bill) => bill.id);
    setSelectedBills(compulsoryBillIds);
    setHasChanges(true);
  };

  const handleAmountEdit = (billId, newAmount) => {
    setEditedAmounts((prev) => ({
      ...prev,
      [billId]: parseFloat(newAmount) || 0,
    }));
    setHasChanges(true);
  };

  const startEditing = (billId) => {
    setEditingBillId(billId);
  };

  const stopEditing = () => {
    setEditingBillId(null);
  };

  const getBillAmount = (bill) => {
    // Return edited amount if exists, otherwise original amount
    return editedAmounts[bill.id] !== undefined
      ? editedAmounts[bill.id]
      : parseFloat(bill.amount);
  };

  // Fetch overpayments
  const fetchStudentOverpayments = async () => {
    try {
      const response = await api.get(
        `/getstudentoverpayments/${studentId}?academic_year_id=${studentInfo?.academic_year_id}&term_id=${studentInfo?.term_id}`
      );
      setStudentOverpayments(
        response.data.filter((op) => op.status === "Active")
      );
    } catch (error) {
      console.error("Error fetching student overpayments:", error);
    }
  };

  // Update calculateTotals to handle overpayments
  const calculateTotals = () => {
    const selectedBillObjects = studentBills
      .filter((bill) => selectedBills.includes(bill.id))
      .map((bill) => ({
        ...bill,
        // Use edited amount if available
        amount:
          editedAmounts[bill.id] !== undefined
            ? editedAmounts[bill.id]
            : parseFloat(bill.amount),
      }));

    const compulsoryTotal = selectedBillObjects
      .filter((bill) => bill.is_compulsory)
      .reduce((sum, bill) => sum + bill.amount, 0);

    const optionalTotal = selectedBillObjects
      .filter((bill) => !bill.is_compulsory)
      .reduce((sum, bill) => sum + bill.amount, 0);

    const currentTermTotal = compulsoryTotal + optionalTotal;

    // Calculate arrears total
    const arrearsTotal = studentArrears.reduce(
      (sum, arrear) => sum + parseFloat(arrear.amount || 0),
      0
    );

    // Calculate overpayments total
    const overpaymentsTotal = studentOverpayments.reduce(
      (sum, op) => sum + parseFloat(op.amount || 0),
      0
    );

    const totalAmount = currentTermTotal + arrearsTotal - overpaymentsTotal;
    // const totalAmount = currentTermTotal;

    return {
      compulsoryTotal,
      optionalTotal,
      currentTermTotal,
      arrearsTotal,
      overpaymentsTotal,
      totalAmount: totalAmount > 0 ? totalAmount : 0, // Don't show negative
      selectedCount: selectedBillObjects.length,
      compulsoryCount: selectedBillObjects.filter((bill) => bill.is_compulsory)
        .length,
      optionalCount: selectedBillObjects.filter((bill) => !bill.is_compulsory)
        .length,
    };
  };

  const saveFinalizedBill = async () => {
    if (selectedBills.length === 0) {
      alert("Please select at least one bill");
      return;
    }

    // Check for compulsory bill modifications
    const compulsoryBills = getCompulsoryBills();
    const selectedCompulsoryBills = compulsoryBills.filter((bill) =>
      selectedBills.includes(bill.id)
    );

    // Check if any compulsory bills have been deselected
    const hasDeselectedCompulsory =
      selectedCompulsoryBills.length < compulsoryBills.length;

    // Check if any compulsory bill amounts have been modified
    const hasModifiedCompulsory = selectedCompulsoryBills.some((bill) => {
      const editedAmount = editedAmounts[bill.id];
      return (
        editedAmount !== undefined && editedAmount !== parseFloat(bill.amount)
      );
    });

    if (hasDeselectedCompulsory) {
      setWarningType("compulsory_deselected");
      setShowWarning(true);
      return;
    }

    if (hasModifiedCompulsory) {
      setWarningType("compulsory_modified");
      setShowWarning(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setSaving(true);
    // try {
    //   const selectedBillObjects = studentBills
    //     .filter((bill) => selectedBills.includes(bill.id))
    //     .map((bill) => ({
    //       ...bill,
    //       amount:
    //         editedAmounts[bill.id] !== undefined
    //           ? editedAmounts[bill.id]
    //           : parseFloat(bill.amount),
    //     }));

    //   const totals = calculateTotals();

    //   // Save the finalized term bill with updated amounts
    //   const response = await api.post(
    //     "/savestudenttermbill",
    //     {
    //       student_id: studentId,
    //       academic_year_id: studentInfo.academic_year_id,
    //       term_id: studentInfo.term_id,
    //       total_amount: totals.totalAmount,
    //       compulsory_amount: totals.compulsoryTotal,
    //       optional_amount: totals.optionalTotal,
    //       selected_bills: selectedBills,
    //       edited_amounts: editedAmounts,
    //       created_by: 1,
    //     }
    //   );
    try {
      const totals = calculateTotals();

      // Find which bill to adjust (default: first compulsory bill)
      let arrearsBillId = null;
      let overpaymentsBillId = null;

      const compulsoryBills = getCompulsoryBills();
      if (compulsoryBills.length > 0) {
        // Use Tuition Fee if exists, otherwise first compulsory
        const tuitionBill = compulsoryBills.find((bill) =>
          bill.category_name?.toLowerCase().includes("tuition")
        );
        arrearsBillId = tuitionBill?.id || compulsoryBills[0].id;
        overpaymentsBillId = arrearsBillId; // Same bill for simplicity
      }

      const response = await api.post(
        "/savestudenttermbill",
        {
          student_id: studentId,
          academic_year_id: studentInfo.academic_year_id,
          term_id: studentInfo.term_id,
          total_amount: totals.totalAmount,
          compulsory_amount: totals.compulsoryTotal,
          optional_amount: totals.optionalTotal,
          selected_bills: selectedBills,
          edited_amounts: editedAmounts,
          created_by: 1,
          arrears_bill_id: arrearsBillId, // NEW
          apply_overpayments_to_bill_id: overpaymentsBillId, // NEW
        }
      );

      if (response.data.finalized) {
        setIsFinalized(true);
        setHasChanges(false);
        setShowWarning(false);

        // CORRECTED: Use setFinalizedBill (with two 'l's)
        setFinalizedBill((prev) => ({
          ...prev,
          total_amount: response.data.total_amount,
          paid_amount: 0, // No payments yet
          remaining_balance: response.data.remaining_balance, // Should equal total_amount
          is_fully_paid: false, // Not paid yet
        }));

        alert("Bill finalized successfully! You can now proceed to payment.");
      }
    } catch (error) {
      console.error("Error finalizing term bill:", error);
      alert("Error saving term bill selection");
    }
    setSaving(false);
  };

  const proceedToPayment = () => {
    if (!isFinalized) {
      alert(
        "Please save the finalized bill first before proceeding to payment"
      );
      return;
    }

    const selectedBillObjects = studentBills
      .filter((bill) => selectedBills.includes(bill.id))
      .map((bill) => ({
        ...bill,
        // Apply edited amounts if they exist
        amount:
          editedAmounts[bill.id] !== undefined
            ? editedAmounts[bill.id]
            : parseFloat(bill.amount),
      }));

    const totals = calculateTotals();

    navigate("/finance/receive-payment", {
      state: {
        studentId,
        studentInfo,
        selectedBills: selectedBillObjects,
        totals,
        isFinalized: true,
      },
    });
  };



  const getCompulsoryBills = () => {
    return studentBills.filter((bill) => bill.is_compulsory);
  };

  const getOptionalBills = () => {
    return studentBills.filter((bill) => !bill.is_compulsory);
  };

  const isBillSelected = (billId) => {
    return selectedBills.includes(billId);
  };

  const canEditFinalizedBill = () => {
    if (!isFinalized) return true;

    if (finalizedBill) {
      // Check if any payments have been made
      const hasNoPayments =
        !finalizedBill.paid_amount ||
        parseFloat(finalizedBill.paid_amount) <= 0;

      return hasNoPayments;
    }

    return false;
  };

  if (loading) {
    return <LoadingSpinner text="Loading student bills..." />;
  }

  const totals = calculateTotals();
  const compulsoryBills = getCompulsoryBills();
  const optionalBills = getOptionalBills();
  const isEditable = !isFinalized || canEditFinalizedBill();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      {/* Updated Header Section */}
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
              {isFinalized
                ? "Finalized Bill Management"
                : "Finalize Student Bill"}
            </h1>
            <p className="text-gray-600">
              {isFinalized
                ? `Manage ${studentInfo?.name}'s finalized bill for ${studentInfo?.academic_year_id} - Term ${studentInfo?.term_id}`
                : "Select bills to create finalized term bill for payment processing"}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Finalized Bill with Payments Message */}

          {isFinalized && hasPayments && (
            <div className="space-y-3">
              <button
                onClick={async () => {
                  const bills = await fetchAvailableOptionalBills();
                  setAvailableOptionalBills(bills);

                  if (bills.length > 0) {
                    setShowAddBillsModal(true);
                    setSelectedNewBills([]);
                    setEditedNewBillAmounts({});
                    setEditingNewBillId(null);
                  } else {
                    // Show helpful message
                    alert(
                      "No additional optional bills available to add. All optional bills for this term may already be included in the finalized bill."
                    );
                  }
                }}
                className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold"
              >
                + Add Optional Bills
              </button>
              <button
                onClick={proceedToPayment}
                disabled={finalizedBill?.remaining_balance <= 0}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  finalizedBill?.remaining_balance > 0
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {finalizedBill?.remaining_balance > 0
                  ? `Make Additional Payment - Ghc ${finalizedBill.remaining_balance} Due`
                  : "Fully Paid - No Payment Required"}
              </button>
            </div>
          )}

          {/* Finalized Bill with No Payments Message */}
          {isFinalized &&
            !hasPayments &&
            finalizedBill?.remaining_balance > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <DocumentCheckIcon className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">
                    Finalized Bill - Ready for Payment
                  </span>
                </div>
                <div className="text-sm text-green-700 mt-1">
                  This bill has been finalized and is ready for payment. You can
                  still make changes until the first payment is received.
                </div>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <BanknotesIcon className="w-4 h-4 mr-1" />
                  <span>
                    Amount Due: Ghc{" "}
                    {Number(
                      finalizedBill?.remaining_balance ??
                        finalizedBill?.total_amount ??
                        0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

          {/* Fully Paid Bill Message */}
          {isFinalized && finalizedBill?.remaining_balance <= 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-semibold text-purple-800">
                  Fully Paid
                </span>
              </div>
              <div className="text-sm text-purple-700 mt-1">
                This bill has been fully paid. No further payments are required
                for this term.
              </div>
              <div className="flex items-center mt-2 text-xs text-purple-600">
                <BanknotesIcon className="w-4 h-4 mr-1" />
                <span>Total Paid: Ghc {finalizedBill?.paid_amount || 0}</span>
              </div>
            </div>
          )}

          {/* Draft Bill Message */}
          {!isFinalized && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-semibold text-yellow-800">
                  Draft Bill
                </span>
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                This is a draft bill. Please review and select the fees to
                include, then finalize the bill to enable payment processing.
              </div>
              <div className="flex items-center mt-2 text-xs text-yellow-600">
                <AcademicCapIcon className="w-4 h-4 mr-1" />
                <span>
                  Select compulsory and optional fees to create the final bill
                </span>
              </div>
            </div>
          )}

          {/* Read-Only Warning */}
          {!canEditFinalizedBill() && isFinalized && (
            <div className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Read-only (payments received)
            </div>
          )}
        </div>
      </div>
      {/* Updated Student Info Card */}
      {studentInfo && (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <UserIcon className="w-12 h-12 text-blue-600" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                {studentInfo.name}
              </h2>
              <p className="text-gray-600">
                {studentInfo.admission_number} • {studentInfo.class_name}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-gray-500">
                  Academic Year: {studentInfo.academic_year_id}
                </span>
                <span className="text-gray-500">
                  Term: {studentInfo.term_id}
                </span>
                {finalizedBill && (
                  <span
                    className={`font-medium ${
                      Number(finalizedBill.remaining_balance || 0) > 0
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    Balance: Ghc{" "}
                    {Number(finalizedBill.remaining_balance) || "0.00"}
                  </span>
                )}
              </div>

              {/* Help text based on current state */}
              <div className="mt-2 text-xs">
                {!isFinalized && (
                  <p className="text-blue-600">
                    💡 Finalize this bill to enable payment processing
                  </p>
                )}
                {isFinalized && hasPayments && (
                  <p className="text-blue-600">
                    📝 Payments received - bill is read-only
                  </p>
                )}
                {isFinalized && !hasPayments && (
                  <p className="text-green-600">
                    ✅ Ready for first payment - you can still make changes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Warning Modal */}
      {/* Warning Modal - UPDATED for compulsory bill edits */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {warningType === "compulsory_deselected"
                  ? "Compulsory Fees Not Selected"
                  : "Compulsory Fees Modified"}
              </h3>
            </div>

            {warningType === "compulsory_deselected" ? (
              <>
                <p className="text-gray-600 mb-4">
                  You have deselected some compulsory fees. Are you sure you
                  want to proceed? Students are normally required to pay all
                  compulsory fees.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={performSave}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    Save Anyway
                  </button>
                  <button
                    onClick={() => {
                      handleSelectAllCompulsory();
                      setShowWarning(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Select All Compulsory
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  You have modified amounts for compulsory fees. This should
                  only be done for special cases like discounts or scholarships.
                  Are you sure you want to proceed?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowWarning(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Review Changes
                  </button>
                  <button
                    onClick={performSave}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                  >
                    Save with Modified Amounts
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bills Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compulsory Bills Section */}
          {/* Compulsory Bills Section - UPDATED to allow editing */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AcademicCapIcon className="w-5 h-5 text-red-500 mr-2" />
                    Compulsory Fees
                    <span className="ml-2 text-sm text-gray-500">
                      ({compulsoryBills.length} bills)
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isEditable
                      ? "These fees are required but amounts can be adjusted for special cases"
                      : "These fees are required for the student"}
                  </p>
                </div>
                {isEditable && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllCompulsory}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDeselectAllCompulsory}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {compulsoryBills.map((bill) => {
                const isSelected = isBillSelected(bill.id);
                const currentAmount = getBillAmount(bill);
                const isEditing = editingBillId === bill.id;
                const originalAmount = parseFloat(bill.amount);

                return (
                  <div
                    key={bill.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {isEditable ? (
                        <button
                          onClick={() =>
                            handleBillSelection(bill.id, true, isSelected)
                          }
                          className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                              ? "bg-red-500 border-red-500"
                              : "bg-white border-gray-300 hover:border-red-500"
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </button>
                      ) : (
                        <div
                          className={`w-6 h-6 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-red-500 border-red-500"
                              : "bg-gray-100 border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {bill.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bill.category_name}
                        </div>
                        <div className="flex items-center mt-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            Due: {new Date(bill.due_date).toLocaleDateString()}
                          </span>
                        </div>
                        {!isSelected && (
                          <div className="text-xs text-red-600 font-medium mt-1">
                            ⚠️ Normally required
                          </div>
                        )}
                        {isSelected && currentAmount !== originalAmount && (
                          <div className="text-xs text-purple-600 font-medium mt-1">
                            💰 Custom amount: {originalAmount.toFixed(2)} →{" "}
                            {currentAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-3">
                      {isEditable && isSelected ? (
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={currentAmount}
                                onChange={(e) =>
                                  handleAmountEdit(bill.id, e.target.value)
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                autoFocus
                              />
                              <button
                                onClick={stopEditing}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-semibold text-gray-900">
                                Ghc {currentAmount.toFixed(2)}
                              </div>
                              <button
                                onClick={() => startEditing(bill.id)}
                                className="text-purple-600 hover:text-purple-800"
                                title="Edit compulsory fee amount"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          Ghc {currentAmount.toFixed(2)}
                          {currentAmount !== originalAmount && (
                            <div className="text-xs text-purple-600 font-medium">
                              (Edited)
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`text-xs font-medium ${
                          isSelected ? "text-red-600" : "text-gray-500"
                        }`}
                      >
                        {isSelected ? "Selected" : "Not Selected"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Optional Bills Section */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BanknotesIcon className="w-5 h-5 text-blue-500 mr-2" />
                    Optional Fees
                    <span className="ml-2 text-sm text-gray-500">
                      ({optionalBills.length} bills)
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Select which optional fees to include. You can edit the
                    amounts.
                  </p>
                </div>
                {isEditable && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllOptional}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDeselectAllOptional}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {optionalBills.map((bill) => {
                const isSelected = isBillSelected(bill.id);
                const currentAmount = getBillAmount(bill);
                const isEditing = editingBillId === bill.id;

                return (
                  <div
                    key={bill.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {isEditable ? (
                        <button
                          onClick={() =>
                            handleBillSelection(bill.id, false, isSelected)
                          }
                          className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "bg-white border-gray-300 hover:border-blue-500"
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </button>
                      ) : (
                        <div
                          className={`w-6 h-6 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "bg-gray-100 border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {bill.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bill.category_name}
                        </div>
                        <div className="flex items-center mt-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            Due: {new Date(bill.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-3">
                      {isEditable && isSelected ? (
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={currentAmount}
                                onChange={(e) =>
                                  handleAmountEdit(bill.id, e.target.value)
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                autoFocus
                              />
                              <button
                                onClick={stopEditing}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-semibold text-gray-900">
                                Ghc {currentAmount.toFixed(2)}
                              </div>
                              <button
                                onClick={() => startEditing(bill.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-lg font-semibold text-gray-900">
                          Ghc {currentAmount.toFixed(2)}
                        </div>
                      )}

                      <div
                        className={`text-xs font-medium ${
                          isSelected ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {isSelected ? "Selected" : "Optional"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bulk Actions */}
          {isEditable && (
            <div className="bg-gray-50 rounded-lg border p-4">
              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSelectAll}
                  className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors text-sm"
                >
                  Select All Bills
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                  Deselect All Bills
                </button>
                <button
                  onClick={handleSelectAllCompulsory}
                  className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
                >
                  Select Only Compulsory
                </button>
                <button
                  onClick={handleSelectAllOptional}
                  className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Select All Optional
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border p-6 sticky top-6">
            {/* Arrears & Overpayments Summary */}
            {(studentArrears.length > 0 || studentOverpayments.length > 0) && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-3">
                  📊 Balance Adjustments
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Arrears */}
                  {studentArrears.length > 0 && (
                    <div className="bg-white border border-orange-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-700">
                          Outstanding Arrears
                        </span>
                        <span className="font-bold text-orange-800">
                          Ghc {calculateTotals().arrearsTotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-orange-600">
                        Will be added to:{" "}
                        <span className="font-medium">Tuition Fee</span>
                      </p>
                    </div>
                  )}

                  {/* Overpayments */}
                  {studentOverpayments.length > 0 && (
                    <div className="bg-white border border-green-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">
                          Available Credits
                        </span>
                        <span className="font-bold text-green-800">
                          Ghc {calculateTotals().overpaymentsTotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-green-600">
                        Will be deducted from:{" "}
                        <span className="font-medium">Tuition Fee</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="mt-3 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                  💡 These adjustments will be automatically applied to your
                  selected bills when you finalize. The payment page will show
                  the adjusted amounts.
                </div>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isFinalized ? "Finalized Bill Summary" : "Bill Summary"}
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Compulsory Fees:</span>
                <span className="font-semibold text-red-600">
                  Ghc {totals.compulsoryTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Optional Fees:</span>
                <span className="font-semibold text-blue-600">
                  Ghc {totals.optionalTotal.toFixed(2)}
                </span>
              </div>

              {/* Current Term Subtotal */}
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-medium">
                  Current Term Subtotal:
                </span>
                <span className="font-semibold text-gray-900">
                  Ghc {totals.currentTermTotal.toFixed(2)}
                </span>
              </div>

              {/* Arrears */}
              {totals.arrearsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">+ Outstanding Arrears:</span>
                  <span className="font-semibold text-orange-600">
                    Ghc {totals.arrearsTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Overpayments/Credits */}
              {totals.overpaymentsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">- Available Credits:</span>
                  <span className="font-semibold text-green-600">
                    Ghc {totals.overpaymentsTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Final Total */}
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span className="text-gray-900">Total Amount Due:</span>
                <span
                  className={`${
                    totals.totalAmount > 0 ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {totals.totalAmount > 0
                    ? `Ghc ${totals.totalAmount.toFixed(2)}`
                    : "Fully Covered by Credits"}
                </span>
              </div>
            </div>

            {/*  compulsory Summary section */}
            <div className="text-sm text-gray-500 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-red-100 border-2 border-red-300 rounded"></div>
                <span>
                  {totals.compulsoryCount} of {compulsoryBills.length}{" "}
                  compulsory bills
                  {compulsoryBills.some((bill) => {
                    const editedAmount = editedAmounts[bill.id];
                    return (
                      editedAmount !== undefined &&
                      editedAmount !== parseFloat(bill.amount)
                    );
                  }) && (
                    <span className="text-purple-600 font-medium ml-1">
                      (Amounts Modified)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded"></div>
                <span>
                  {totals.optionalCount} of {optionalBills.length} optional
                  bills
                  {optionalBills.some((bill) => {
                    const editedAmount = editedAmounts[bill.id];
                    return (
                      editedAmount !== undefined &&
                      editedAmount !== parseFloat(bill.amount)
                    );
                  }) && (
                    <span className="text-purple-600 font-medium ml-1">
                      (Amounts Modified)
                    </span>
                  )}
                </span>
              </div>

              {/* Show modified amounts summary */}
              {(compulsoryBills.some(
                (bill) => editedAmounts[bill.id] !== undefined
              ) ||
                optionalBills.some(
                  (bill) => editedAmounts[bill.id] !== undefined
                )) && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                  <div className="font-medium">Custom Amounts Applied:</div>
                  {compulsoryBills.map((bill) => {
                    const editedAmount = editedAmounts[bill.id];
                    if (
                      editedAmount !== undefined &&
                      editedAmount !== parseFloat(bill.amount)
                    ) {
                      return (
                        <div key={bill.id}>
                          • {bill.category_name}:{" "}
                          {parseFloat(bill.amount).toFixed(2)} →{" "}
                          {editedAmount.toFixed(2)}
                        </div>
                      );
                    }
                    return null;
                  })}
                  {optionalBills.map((bill) => {
                    const editedAmount = editedAmounts[bill.id];
                    if (
                      editedAmount !== undefined &&
                      editedAmount !== parseFloat(bill.amount)
                    ) {
                      return (
                        <div key={bill.id}>
                          • {bill.category_name}:{" "}
                          {parseFloat(bill.amount).toFixed(2)} →{" "}
                          {editedAmount.toFixed(2)}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isEditable && (
                <>
                  <button
                    onClick={saveFinalizedBill}
                    disabled={
                      saving || totals.selectedCount === 0 || !hasChanges
                    }
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
                  >
                    <DocumentCheckIcon className="w-5 h-5" />
                  
                    <span>
                      {saving
                        ? "Saving..."
                        : isFinalized
                        ? "Update Bill"
                        : "Finalize Bill for Payment"}
                    </span>
                  </button>

                  <button
                    onClick={proceedToPayment}
                    disabled={
                      !isFinalized ||
                      (finalizedBill?.remaining_balance <= 0 &&
                        finalizedBill?.paid_amount > 0)
                    }
                    className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                      isFinalized && finalizedBill?.remaining_balance > 0
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <BanknotesIcon className="w-5 h-5" />
                    <span>
                      {!isFinalized
                        ? "Finalize Bill First"
                        : finalizedBill?.remaining_balance <= 0 &&
                          finalizedBill?.paid_amount > 0
                        ? "Fully Paid - No Payment Required"
                        : `Proceed to Payment - Ghc ${
                            finalizedBill?.remaining_balance || "0.00"
                          } Due`}
                    </span>
                  </button>
                  {isFinalized && (
                    <div className="text-xs text-center space-y-1">
                      {finalizedBill?.paid_amount > 0 && (
                        <div
                          className={`p-2 rounded ${
                            finalizedBill.remaining_balance > 0
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {finalizedBill.remaining_balance > 0
                            ? `Partially Paid: Ghc ${finalizedBill.paid_amount.toFixed(
                                2
                              )} received, Ghc ${finalizedBill.remaining_balance.toFixed(
                                2
                              )} remaining`
                            : `Fully Paid: Ghc ${finalizedBill.paid_amount.toFixed(
                                2
                              )} received`}
                        </div>
                      )}
                      {finalizedBill?.last_payment_date && (
                        <div className="text-gray-500">
                          Last payment:{" "}
                          {new Date(
                            finalizedBill.last_payment_date
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!isEditable && isFinalized && (
                <>
                  <button
                    onClick={proceedToPayment}
                    className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
                  >
                    Proceed to Payment
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    {hasPayments
                      ? "Bill cannot be modified because payments have been received"
                      : "Bill is finalized and ready for payment"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddBillsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Optional Bills
                </h3>
                <button
                  onClick={() => {
                    setShowAddBillsModal(false);
                    setSelectedNewBills([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Select additional optional bills to add to the finalized term
                bill. You cannot add compulsory bills after payments have been
                made.
              </p>

              {availableOptionalBills.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {availableOptionalBills.map((bill) => {
                      const isEditing = editingNewBillId === bill.id;
                      const displayAmount = getNewBillDisplayAmount(bill);
                      const originalAmount = parseFloat(bill.amount);
                      const hasCustomAmount = displayAmount !== originalAmount;

                      return (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedNewBills.includes(bill.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNewBills((prev) => [
                                    ...prev,
                                    bill.id,
                                  ]);
                                } else {
                                  setSelectedNewBills((prev) =>
                                    prev.filter((id) => id !== bill.id)
                                  );
                                  // Clear edited amount if deselected
                                  setEditedNewBillAmounts((prev) => {
                                    const newState = { ...prev };
                                    delete newState[bill.id];
                                    return newState;
                                  });
                                  setEditingNewBillId(null);
                                }
                              }}
                              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">
                                {bill.description}
                              </div>
                              <div className="text-sm text-gray-500">
                                {bill.category_name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {/* Amount Display/Edit */}
                            {selectedNewBills.includes(bill.id) ? (
                              <div className="flex items-center space-x-2">
                                {isEditing ? (
                                  <>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={displayAmount}
                                      onChange={(e) =>
                                        handleNewBillAmountEdit(
                                          bill.id,
                                          e.target.value
                                        )
                                      }
                                      className="w-32 px-3 py-1 border border-purple-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => setEditingNewBillId(null)}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <CheckIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-right">
                                      <div className="text-lg font-semibold text-gray-900">
                                        Ghc {displayAmount.toFixed(2)}
                                        {hasCustomAmount && (
                                          <div className="text-xs text-purple-600 font-medium">
                                            (Custom)
                                          </div>
                                        )}
                                      </div>
                                      {hasCustomAmount && (
                                        <div className="text-xs text-gray-500">
                                          Original: Ghc{" "}
                                          {originalAmount.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        setEditingNewBillId(bill.id)
                                      }
                                      className="text-purple-600 hover:text-purple-800"
                                      title="Edit bill amount"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="text-lg font-semibold text-gray-900">
                                Ghc {originalAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Selected Bills:</span>
                      <span className="font-semibold">
                        {selectedNewBills.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Additional Amount:</span>
                      <span className="font-semibold text-purple-600">
                        Ghc{" "}
                        {availableOptionalBills
                          .filter((bill) => selectedNewBills.includes(bill.id))
                          .reduce((sum, bill) => {
                            const amount =
                              editedNewBillAmounts[bill.id] !== undefined
                                ? editedNewBillAmounts[bill.id]
                                : parseFloat(bill.amount);
                            return sum + amount;
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddBillsModal(false);
                        setSelectedNewBills([]);
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNewBills}
                      disabled={saving || selectedNewBills.length === 0}
                      className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving
                        ? "Adding..."
                        : `Add ${selectedNewBills.length} Bill(s)`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No additional optional bills available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {studentBills.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <BanknotesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Pending Bills
          </h3>
          <p className="text-gray-500">
            This student doesn't have any pending bills at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentBillSelection;
