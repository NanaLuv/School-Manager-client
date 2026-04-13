import React from "react";
import { XMarkIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";

const PDFPreviewModal = ({
  isOpen,
  onClose,
  pdfUrl,
  studentName,
  onDownload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Report Card Preview - {studentName}
            </h2>
            <p className="text-sm text-gray-600">
              Preview the report card before downloading
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onDownload}
              className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="flex-1 p-4">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded-lg"
              title="Report Card Preview"
              type="application/pdf"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Loading preview...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;
