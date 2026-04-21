import React, { useState, useEffect } from "react";
import {
  BanknotesIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../common/LoadingSpinner";
import api from "../axiosconfig/axiosConfig";

const PaymentHistory = ({ studentId, academicContext }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [allocationDetails, setAllocationDetails] = useState({});

  //   const fetchPaymentHistory = async () => {
  //     if (!studentId) return;

  //     setLoading(true);
  //     try {
  //       const response = await api.get(
  //         `/getpaymenthistory/${studentId}`
  //       );
  //       setPaymentHistory(response.data);
  //     } catch (error) {
  //       console.error("Error fetching payment history:", error);
  //     }
  //     setLoading(false);
  //   };

  const fetchPaymentHistory = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      // Get current academic context if not provided
      let context = academicContext;
      if (!context) {
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

        context = {
          academic_year_id: currentYear?.id,
          term_id: currentTerm?.id,
        };
      }

      // Fetch payments for CURRENT TERM only
      const response = await api.get(
        `/getpaymenthistory/${studentId}?academic_year_id=${context.academic_year_id}&term_id=${context.term_id}`,
      );

      setPaymentHistory(response.data);

      console.log("Payment history for term:", {
        academic_year_id: context.academic_year_id,
        term_id: context.term_id,
        paymentCount: response.data.length,
      });
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
    setLoading(false);
  };

  const fetchAllocationDetails = async (paymentId) => {
    try {
      const response = await api.get(`/getpaymentallocations/${paymentId}`);
      console.log("allocation details", response.data);
      setAllocationDetails((prev) => ({
        ...prev,
        [paymentId]: response.data,
      }));
    } catch (error) {
      console.error("Error fetching allocation details:", error);
    }
  };

  const togglePaymentDetails = async (paymentId) => {
    if (expandedPayment === paymentId) {
      setExpandedPayment(null);
    } else {
      setExpandedPayment(paymentId);
      // Fetch allocation details if not already loaded
      if (!allocationDetails[paymentId]) {
        await fetchAllocationDetails(paymentId);
      }
    }
  };

  const formatCurrency = (amount) => {
    return `Ghc ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      Cash: "💵",
      "Bank Transfer": "🏦",
      "Mobile Money": "📱",
      Check: "📋",
      Card: "💳",
    };
    return icons[method] || "💰";
  };

  const getStatusColor = (payment) => {
    const totalAllocated =
      allocationDetails[payment.id]?.reduce(
        (sum, alloc) => sum + parseFloat(alloc.amount_allocated || 0),
        0,
      ) || 0;

    if (Math.abs(totalAllocated - parseFloat(payment.amount_paid)) < 0.01) {
      return "bg-green-100 text-green-800";
    } else if (totalAllocated > 0) {
      return "bg-blue-100 text-blue-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (payment) => {
    const totalAllocated =
      allocationDetails[payment.id]?.reduce(
        (sum, alloc) => sum + parseFloat(alloc.amount_allocated || 0),
        0,
      ) || 0;

    if (Math.abs(totalAllocated - parseFloat(payment.amount_paid)) < 0.01) {
      return "Fully Allocated";
    } else if (totalAllocated > 0) {
      return "Partially Allocated";
    } else {
      return "Not Allocated";
    }
  };

  useEffect(() => {
    if (showPaymentHistory && studentId) {
      fetchPaymentHistory();
    }
  }, [showPaymentHistory, studentId]);

  if (!studentId) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <BanknotesIcon className="w-5 h-5 mr-2 text-blue-500" />
          Payment History
        </h2>
        <button
          onClick={() => setShowPaymentHistory(!showPaymentHistory)}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showPaymentHistory ? (
            <EyeSlashIcon className="w-4 h-4" />
          ) : (
            <EyeIcon className="w-4 h-4" />
          )}
          <span>{showPaymentHistory ? "Hide" : "Show"} History</span>
        </button>
      </div>

      {showPaymentHistory && (
        <>
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner text="Loading payment history..." />
            </div>
          ) : paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Payment Header */}
                  <div
                    className="p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-t-lg"
                    onClick={() => togglePaymentDetails(payment.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {payment.receipt_number}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {formatDate(payment.payment_date)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <CreditCardIcon className="w-4 h-4 mr-1" />
                            {getPaymentMethodIcon(payment.payment_method)}{" "}
                            {payment.payment_method}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Received by: {payment.received_by_name || "Admin"}
                          {payment.reference_number &&
                            ` • Ref: ${payment.reference_number}`}
                        </div>
                        {payment.notes && (
                          <div className="text-sm text-gray-600 mt-1 italic">
                            "{payment.notes}"
                          </div>
                        )}
                      </div>
                      <div className="text-right flex items-start space-x-3">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(payment.amount_paid)}
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              payment,
                            )}`}
                          >
                            {getStatusText(payment)}
                          </div>
                        </div>
                        <div className="flex items-center text-gray-400">
                          {expandedPayment === payment.id ? (
                            <ChevronDownIcon className="w-5 h-5" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details - Expanded */}
                  {expandedPayment === payment.id && (
                    <div className="p-4 bg-white border-t">
                      {/* Allocation Details */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          Bill Allocations
                        </h4>

                        {allocationDetails[payment.id] &&
                        allocationDetails[payment.id].length > 0 ? (
                          <div className="space-y-3">
                            {allocationDetails[payment.id].map(
                              (allocation, index) => (
                                <div
                                  key={allocation.id}
                                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {allocation.category_name ||
                                        allocation.description ||
                                        `Bill #${allocation.bill_id}`}
                                    </div>
                                    {allocation.description &&
                                      allocation.description !==
                                        allocation.category_name && (
                                        <div className="text-sm text-gray-600 mt-1">
                                          {allocation.description}
                                        </div>
                                      )}
                                    <div className="text-xs text-gray-500 mt-1">
                                      Due: {formatDate(allocation.due_date)}
                                      {allocation.is_compulsory && (
                                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                          Compulsory
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-semibold text-blue-600">
                                      {formatCurrency(
                                        allocation.amount_allocated,
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Bill Total:{" "}
                                      {formatCurrency(allocation.bill_amount)}
                                    </div>
                                    {allocation.bill_status && (
                                      <div
                                        className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                          allocation.bill_status === "Paid"
                                            ? "bg-green-100 text-green-800"
                                            : allocation.bill_status ===
                                                "Partially Paid"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {allocation.bill_status}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}

                            {/* Allocation Summary */}
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="font-semibold text-blue-900">
                                Total Allocated:
                              </div>
                              <div className="font-bold text-blue-900">
                                {formatCurrency(
                                  allocationDetails[payment.id].reduce(
                                    (sum, alloc) =>
                                      sum +
                                      parseFloat(alloc.amount_allocated || 0),
                                    0,
                                  ),
                                )}
                              </div>
                            </div>

                            {/* Allocation vs Payment Comparison */}
                            {(() => {
                              const totalAllocated = allocationDetails[
                                payment.id
                              ].reduce(
                                (sum, alloc) =>
                                  sum + parseFloat(alloc.amount_allocated || 0),
                                0,
                              );
                              const paymentAmount = parseFloat(
                                payment.amount_paid,
                              );
                              const difference = Math.abs(
                                totalAllocated - paymentAmount,
                              );

                              if (difference > 0.01) {
                                return (
                                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex justify-between text-sm text-yellow-800">
                                      <span>Unallocated Amount:</span>
                                      <span className="font-semibold">
                                        {formatCurrency(
                                          paymentAmount - totalAllocated,
                                        )}
                                      </span>
                                    </div>
                                    <div className="text-xs text-yellow-600 mt-1">
                                      This amount was not allocated to any
                                      specific bill.
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                            <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No allocation details found for this payment</p>
                            <p className="text-sm">
                              The payment was not allocated to specific bills
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Payment Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            Payment Information
                          </h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment ID:</span>
                              <span className="font-mono">#{payment.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Receipt Number:
                              </span>
                              <span className="font-mono">
                                {payment.receipt_number}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Allocated to Bills:
                              </span>
                              <span>
                                {allocationDetails[payment.id]?.length || 0}{" "}
                                bills
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            Transaction Details
                          </h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Payment Date:
                              </span>
                              <span>{formatDate(payment.payment_date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Processed by:
                              </span>
                              <span>
                                {payment.received_by_name || "System"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Allocation Status:
                              </span>
                              <span className={getStatusColor(payment)}>
                                {getStatusText(payment)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Summary */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {paymentHistory.length}
                    </div>
                    <div className="text-gray-600">Total Payments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        paymentHistory.reduce(
                          (sum, p) => sum + parseFloat(p.amount_paid),
                          0,
                        ),
                      )}
                    </div>
                    <div className="text-gray-600">Total Amount Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {
                        paymentHistory.filter(
                          (p) => allocationDetails[p.id]?.length > 0,
                        ).length
                      }
                    </div>
                    <div className="text-gray-600">
                      Payments with Allocations
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 text-center">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No Payment History
              </p>
              <p className="text-gray-600">
                No payments have been recorded for this student yet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentHistory;
