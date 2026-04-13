import React, { useState } from "react";
import {
  XMarkIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import api from "../axiosconfig/axiosConfig";
import { toast } from "react-hot-toast";

const BulkReminderModal = ({ isOpen, onClose, filters = {}, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [confirmSend, setConfirmSend] = useState(false);

  if (!isOpen) return null;

  const handleSendReminders = async () => {
    setLoading(true);
    setResults(null);

    try {
      const response = await api.post("/send-bulk-reminders", {
        academic_year_id: filters.academic_year_id,
        term_id: filters.term_id,
        filters: {
          class_id: filters.class_id,
          min_balance: filters.min_balance,
        },
      });

      setResults(response.data);

      if (response.data.success) {
        toast.success(
          <div>
            <div className="font-bold">Bulk Reminders Sent!</div>
            <div className="text-sm">
              {response.data.sent_count} sent, {response.data.failed_count}{" "}
              failed
            </div>
          </div>,
          { duration: 5000 },
        );
      }

      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      console.error("Error sending bulk reminders:", error);
      toast.error(error.response?.data?.error || "Failed to send reminders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <EnvelopeIcon className="w-5 h-5 mr-2 text-blue-500" />
            Send Bulk Balance Reminders
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {!results ? (
            <div>
              {!confirmSend ? (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-semibold text-yellow-800">
                        Are you sure?
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      This will send balance reminder emails to ALL parents with
                      outstanding fees. Please confirm before proceeding.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium mb-2">Reminder Settings:</h3>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-gray-600">Academic Year:</dt>
                      <dd>{filters.academic_year_label || "Current"}</dd>

                      <dt className="text-gray-600">Term:</dt>
                      <dd>{filters.term_name || "Current"}</dd>

                      {filters.class_name && (
                        <>
                          <dt className="text-gray-600">Class:</dt>
                          <dd>{filters.class_name}</dd>
                        </>
                      )}

                      {filters.min_balance && (
                        <>
                          <dt className="text-gray-600">Min Balance:</dt>
                          <dd>Ghc {filters.min_balance}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ArrowPathIcon className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Sending reminders...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This may take a few moments
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div
                className={`rounded-lg p-4 mb-4 ${
                  results.failed_count === 0
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <h3 className="font-semibold mb-2">Results Summary:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Students</div>
                    <div className="text-2xl font-bold">
                      {results.total_students}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      Total Outstanding
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      Ghc {results.summary?.total_outstanding || 0}
                    </div>
                  </div>
                  <div className="col-span-2 grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-green-100 p-2 rounded text-center">
                      <div className="text-xs text-gray-600">Sent</div>
                      <div className="text-lg font-bold text-green-600">
                        {results.sent_count}
                      </div>
                    </div>
                    <div className="bg-red-100 p-2 rounded text-center">
                      <div className="text-xs text-gray-600">Failed</div>
                      <div className="text-lg font-bold text-red-600">
                        {results.failed_count}
                      </div>
                    </div>
                    <div className="bg-gray-100 p-2 rounded text-center">
                      <div className="text-xs text-gray-600">Skipped</div>
                      <div className="text-lg font-bold text-gray-600">
                        {results.skipped_count || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              {results.results && results.results.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Detailed Results:</h4>
                  <div className="max-h-60 overflow-y-auto border rounded">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Student</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.results.map((result, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">
                              <div className="font-medium">{result.name}</div>
                            </td>
                            <td className="p-2">
                              {result.success ? (
                                <span className="inline-flex items-center text-green-600">
                                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                                  Sent
                                </span>
                              ) : result.skipped ? (
                                <span className="inline-flex items-center text-gray-500">
                                  <XCircleIcon className="w-4 h-4 mr-1" />
                                  Skipped
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-red-600">
                                  <XCircleIcon className="w-4 h-4 mr-1" />
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-xs text-gray-600">
                              {result.recipient && (
                                <div>{result.recipient}</div>
                              )}
                              {result.message && (
                                <div className="text-red-500">
                                  {result.message}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>

          {!results && !confirmSend && (
            <button
              onClick={() => setConfirmSend(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Yes, Send Reminders
            </button>
          )}

          {!results && confirmSend && !loading && (
            <button
              onClick={handleSendReminders}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkReminderModal;
