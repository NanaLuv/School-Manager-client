// components/grades/GradeImport.js
import React, { useState } from "react";
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

const GradeImport = ({
  classId,
  subjects,
  terms,
  academicYearId,
  onImport,
}) => {
  const [importing, setImporting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [importResults, setImportResults] = useState(null);

  const downloadTemplate = async () => {
    if (!selectedSubject || !selectedTerm) {
      alert("Please select subject and term first");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3001/schmgt/exportgradetemplate?class_id=${classId}&subject_id=${selectedSubject}&term_id=${selectedTerm}&academic_year_id=${academicYearId}`,
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `grade_template_class${classId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Error downloading template");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedSubject || !selectedTerm) {
      alert("Please select subject and term first");
      return;
    }

    setImporting(true);
    setImportResults(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject_id", selectedSubject);
    formData.append("term_id", selectedTerm);
    formData.append("academic_year_id", academicYearId);

    try {
      const response = await axios.post(
        "http://localhost:3001/schmgt/importgrades",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setImportResults(response.data);
      alert(`Import completed: ${response.data.message}`);

      if (onImport) {
        onImport();
      }
    } catch (error) {
      console.error("Error importing grades:", error);
      alert(
        "Error importing grades: " +
          (error.response?.data?.error || error.message)
      );
    }
    setImporting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Import Grades from Excel
      </h3>

      {/* Subject and Term Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select Subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Term *
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={downloadTemplate}
          disabled={!selectedSubject || !selectedTerm}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>Download Template</span>
        </button>

        <label className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <DocumentArrowUpIcon className="w-5 h-5" />
          <span>{importing ? "Importing..." : "Import Grades"}</span>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={importing || !selectedSubject || !selectedTerm}
            className="hidden"
          />
        </label>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Select subject and term above</li>
          <li>2. Download the template Excel file</li>
          <li>3. Fill in Class Score (0-50) and Exam Score (0-50) columns</li>
          <li>4. Upload the filled Excel file</li>
          <li>5. Existing scores will be updated, new ones will be created</li>
        </ul>
      </div>

      {/* Import Results */}
      {importResults && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            importResults.errors.length > 0
              ? "bg-yellow-50 border border-yellow-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <h4 className="font-medium mb-2">Import Results:</h4>
          <p>Successfully processed: {importResults.success} records</p>
          <p>
            New: {importResults.created} | Updated: {importResults.updated}
          </p>
          {importResults.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium">
                Errors: {importResults.errors.length}
              </p>
              <ul className="text-sm max-h-32 overflow-y-auto">
                {importResults.errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-red-600">
                    {error.admission_number}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradeImport;
