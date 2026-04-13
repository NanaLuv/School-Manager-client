import React, { useRef, useState } from "react";
import {
  AcademicCapIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { generateBillPDF, generatePDFFromElement } from "../bill-preview/pdfService"

const BillPreview = ({ preview, onClose, onGeneratePDF }) => {
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const billRef = useRef(); 


  // NEW: Enhanced PDF generation handler
  const handleGeneratePDF = async () => {
    if (!preview) return;

    setGeneratingPDF(true);
    try {
      await generateBillPDF(preview);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (!preview) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        ref={billRef} 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bill Preview</h2>
            <p className="text-gray-600">
              {preview.student.name} - {preview.student.admission_number}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>{generatingPDF ? "Generating..." : "Download PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div className="p-6">
          {/* Student Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Student:</span>
                <div>{preview.student.name}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Admission No:</span>
                <div>{preview.student.admission_number}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Class:</span>
                <div>{preview.student.class_name}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <div
                  className={
                    preview.isFinalized
                      ? "text-green-600 font-medium"
                      : "text-blue-600 font-medium"
                  }
                >
                  {preview.isFinalized ? "Finalized" : "Draft"}
                </div>
              </div>
            </div>
          </div>

          {/* Compulsory Bills */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <AcademicCapIcon className="w-5 h-5 text-red-500 mr-2" />
              Compulsory Fees
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg">
              {preview.compulsoryBills.map((bill, index) => (
                <div
                  key={bill.id}
                  className={`p-3 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {bill.category_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {bill.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        Ghc{" "}
                        {preview.isFinalized && bill.finalAmount
                          ? bill.finalAmount.toFixed(2)
                          : parseFloat(bill.amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Due: {new Date(bill.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-red-50 border-t border-red-200">
                <div className="flex justify-between font-semibold">
                  <span>Compulsory Total:</span>
                  <span className="text-red-600">
                    Ghc {preview.totals.compulsory.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Bills (if any) */}
          {preview.optionalBills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <BanknotesIcon className="w-5 h-5 text-blue-500 mr-2" />
                Optional Fees {preview.isFinalized && "(Selected)"}
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg">
                {preview.optionalBills.map((bill, index) => (
                  <div
                    key={bill.id}
                    className={`p-3 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {bill.category_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bill.description}
                        </div>
                        {!bill.isSelected && preview.isFinalized && (
                          <div className="text-xs text-red-500">
                            (Not selected in finalized bill)
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          Ghc{" "}
                          {preview.isFinalized && bill.finalAmount
                            ? bill.finalAmount.toFixed(2)
                            : parseFloat(bill.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: {new Date(bill.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-blue-50 border-t border-blue-200">
                  <div className="flex justify-between font-semibold">
                    <span>Optional Total:</span>
                    <span className="text-blue-600">
                      Ghc {preview.totals.optional.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Arrears (if any) */}
          {preview.arrears.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mr-2" />
                Outstanding Arrears
              </h3>
              <div className="bg-white border border-orange-200 rounded-lg">
                {preview.arrears.map((arrear, index) => (
                  <div
                    key={arrear.id}
                    className={`p-3 ${
                      index % 2 === 0 ? "bg-orange-50" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {arrear.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          Added:{" "}
                          {new Date(arrear.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="font-semibold text-orange-600">
                        Ghc {parseFloat(arrear.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-orange-50 border-t border-orange-200">
                  <div className="flex justify-between font-semibold">
                    <span>Total Arrears:</span>
                    <span className="text-orange-600">
                      Ghc {preview.totals.arrearsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overpayments/Credits (if any) */}
          {preview.overpayments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                Available Credits
              </h3>
              <div className="bg-white border border-green-200 rounded-lg">
                {preview.overpayments.map((overpayment, index) => (
                  <div
                    key={overpayment.id}
                    className={`p-3 ${
                      index % 2 === 0 ? "bg-green-50" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {overpayment.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          Credit Note •{" "}
                          {overpayment.can_refund
                            ? "Refundable"
                            : "Non-refundable"}
                        </div>
                      </div>
                      <div className="font-semibold text-green-600">
                        Ghc {parseFloat(overpayment.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-green-50 border-t border-green-200">
                  <div className="flex justify-between font-semibold">
                    <span>Total Credits:</span>
                    <span className="text-green-600">
                      Ghc {preview.totals.overpaymentsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Total */}
          <div className="bg-gray-900 text-white p-6 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>TOTAL AMOUNT DUE:</span>
              <span className="text-2xl">
                {preview.totals.total > 0
                  ? `Ghc ${preview.totals.total.toFixed(2)}`
                  : "FULLY COVERED BY CREDITS"}
              </span>
            </div>
            {preview.totals.total <= 0 && (
              <div className="text-center text-green-300 text-sm mt-2">
                No payment required - credits cover all charges
              </div>
            )}
          </div>

          {/* Footer Notes */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              This is a {preview.isFinalized ? "finalized" : "preview"} bill.{" "}
              {!preview.isFinalized &&
                "Amounts may change when bill is finalized."}
            </p>
            <p>Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPreview;
