import React, { useState } from "react";
import {
  EnvelopeIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import PDFPreviewModal from "../../components/report-cards/PDFPreviewModal";
import api from "../../components/axiosconfig/axiosConfig";

const BulkReportCardActions = ({ selectedReportCards, onComplete }) => {
  const [action, setAction] = useState("");
  const [processing, setProcessing] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [previewData, setPreviewData] = useState({
    isOpen: false,
    pdfUrl: null,
    studentName: "",
  });

  const handleBulkAction = async () => {
    if (!action || selectedReportCards.length === 0) {
      alert("Please select an action and at least one report card");
      return;
    }

    setProcessing(true);

    try {
      if (action === "export") {
        // Generate and download PDFs one by one
        for (const reportCardId of selectedReportCards) {
          try {
            const response = await api.get(
              `/generatestudentreportcardpdf/${reportCardId}`,
              { responseType: "blob" }
            );

            // Create download link for individual PDF
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `report-card-${reportCardId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Clean up and small delay between downloads
            window.URL.revokeObjectURL(url);
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.error(
              `Error exporting report card ${reportCardId}:`,
              error
            );
          }
        }

        alert(
          `Downloaded ${selectedReportCards.length} individual report cards`
        );
      }

      if (action === "preview") {
        // Preview first selected report card
        if (selectedReportCards.length > 0) {
          await handlePreviewReportCard(selectedReportCards[0]);
        }
      }

      setAction("");
      setCustomMessage("");
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert(
        "Error performing bulk action: " +
          (error.response?.data?.error || error.message)
      );
    }
    setProcessing(false);
  };

  // Preview individual report card
  // Fixed preview function
  const handlePreviewReportCard = async (reportCardId) => {
    try {
      const response = await api.get(
        `/generatestudentreportcardpdf/${reportCardId}`,
        {
          responseType: "blob", // Important for binary data
        }
      );

      // Create blob URL for the PDF
      const blob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(blob);

      // Get student name for the preview modal
      const reportCardResponse = await api.get(
        `/getreportcard/${reportCardId}`
      );

      setPreviewData({
        isOpen: true,
        pdfUrl,
        studentName: `${reportCardResponse.data.first_name} ${reportCardResponse.data.last_name}`,
      });
    } catch (error) {
      console.error("Error previewing report card:", error);
      alert("Error generating preview: " + error.message);
    }
  };

  const handleDownloadPreview = () => {
    if (previewData.pdfUrl) {
      const link = document.createElement("a");
      link.href = previewData.pdfUrl;
      link.setAttribute(
        "download",
        `report-card-${previewData.studentName.replace(/\s+/g, "-")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const closePreview = () => {
    // Clean up the blob URL to prevent memory leaks
    if (previewData.pdfUrl) {
      URL.revokeObjectURL(previewData.pdfUrl);
    }
    setPreviewData({ isOpen: false, pdfUrl: null, studentName: "" });
  };



  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-blue-900">
              Bulk Actions ({selectedReportCards.length} selected)
            </h3>
            <p className="text-sm text-blue-700">
              Perform actions on multiple report cards
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-700">
              {selectedReportCards.length} selected
            </span>
            <CheckIcon className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Action</option>
              {/*<option value="preview">Preview Report Card</option>*/}
              <option value="export">Download PDFs</option>
              {/* <option value="email">Send Email</option> */}
            </select>
          </div>

          {action === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Custom message for all emails..."
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={handleBulkAction}
              disabled={processing || !action}
              className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {action === "email" && <EnvelopeIcon className="w-4 h-4" />}
              {action === "export" && (
                <DocumentArrowDownIcon className="w-4 h-4" />
              )}
              {action === "preview" && <EyeIcon className="w-4 h-4" />}
              <span>{processing ? "Processing..." : `Execute ${action}`}</span>
            </button>
          </div>
        </div>

        {/* Quick Individual Actions */}
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">
            Quick Individual Actions:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedReportCards.slice(0, 5).map((reportCardId) => (
              <button
                key={reportCardId}
                onClick={() => handlePreviewReportCard(reportCardId)}
                className="flex items-center space-x-1 bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition-colors"
              >
                <EyeIcon className="w-3 h-3" />
                <span>Preview #{reportCardId}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewData.isOpen}
        onClose={closePreview}
        pdfUrl={previewData.pdfUrl}
        studentName={previewData.studentName}
        onDownload={handleDownloadPreview}
      />
    </>
  );
};

export default BulkReportCardActions;
