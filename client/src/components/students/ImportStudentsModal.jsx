import React, { useState, useRef } from "react";
import { DocumentArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import axios from "axios";

const ImportStudentsModal = ({ isOpen, onClose, onImportComplete }) => {
  const [importData, setImportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [results, setResults] = useState({ success: 0, errors: [] });
  const [availableClasses, setAvailableClasses] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch available classes for validation
  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/schmgt/getclasses"
        );
        setAvailableClasses(response.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        const mappedData = rows
          .map((row, index) => {
            const student = {};
            headers.forEach((header, colIndex) => {
              if (header && row[colIndex] !== undefined) {
                const key = header.toLowerCase().replace(/\s+/g, "_");
                student[key] = row[colIndex];
              }
            });
            return { ...student, _row: index + 2 };
          })
          .filter(
            (student) =>
              student.admission_number ||
              student.first_name ||
              student.last_name
          );

        // Validate class names
        const validatedData = mappedData.map((student) => {
          if (student.class_name) {
            const classExists = availableClasses.some(
              (cls) => cls.class_name === student.class_name
            );
            return {
              ...student,
              _classValid: classExists,
              _classError: classExists
                ? null
                : `Class '${student.class_name}' not found`,
            };
          }
          return { ...student, _classValid: true, _classError: null };
        });

        setImportData(validatedData);
        setStep(2);
      } catch (error) {
        alert("Error reading Excel file: " + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      // Remove validation fields before sending to backend
      const studentsToImport = importData.map(
        ({ _classValid, _classError, ...student }) => student
      );

      const response = await axios.post(
        "http://localhost:3001/schmgt/importstudents",
        {
          students: studentsToImport,
        }
      );

      setResults(response.data);
      setStep(3);
    } catch (error) {
      console.error("Error importing students:", error);
      setResults({
        success: 0,
        errors: [
          { row: 0, error: "Failed to import students: " + error.message },
        ],
      });
      setStep(3);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setImportData([]);
    setResults({ success: 0, errors: [] });
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleComplete = () => {
    handleReset();
    onImportComplete();
  };

  const downloadTemplate = () => {
    const templateData = [
      [
        "admission_number",
        "first_name",
        "last_name",
        "date_of_birth",
        "gender",
        "parent_name",
        "parent_contact",
        "address",
        "enrolled_date",
        "class_name",
      ],
      [
        "ADM001",
        "John",
        "Doe",
        "2010-05-15",
        "Male",
        "Jane Doe",
        "john.doe@email.com",
        "123 Main St",
        "2024-01-15",
        "Grade 10A",
      ],
      [
        "ADM002",
        "Sarah",
        "Smith",
        "2011-08-22",
        "Female",
        "Mike Smith",
        "555-0123",
        "456 Oak Ave",
        "2024-01-15",
        "Grade 9B",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");
    XLSX.writeFile(wb, "students_import_template.xlsx");
  };

  // Count students with invalid classes
  const invalidClassCount = importData.filter(
    (student) => !student._classValid
  ).length;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 1 && "Import Students from Excel"}
            {step === 2 && "Preview Import Data"}
            {step === 3 && "Import Results"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="text-center">
              <DocumentArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Excel File
              </h3>
              <p className="text-gray-600 mb-6">
                Upload an Excel file with student data. Download the template
                below for the correct format.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Choose Excel File
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  .xlsx or .xls files only
                </p>
              </div>

              <button
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Download Import Template
              </button>

              <div className="mt-6 text-left bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Expected Columns:
                </h4>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>
                    <strong>admission_number</strong> (Required) - Unique
                    student ID
                  </li>
                  <li>
                    <strong>first_name</strong> (Required) - Student's first
                    name
                  </li>
                  <li>
                    <strong>last_name</strong> (Required) - Student's last name
                  </li>
                  <li>
                    <strong>date_of_birth</strong> (Required) - YYYY-MM-DD
                    format
                  </li>
                  <li>
                    <strong>gender</strong> (Required) - Male/Female/Other
                  </li>
                  <li>
                    <strong>parent_name</strong> (Required) - Parent/guardian
                    name
                  </li>
                  <li>
                    <strong>parent_contact</strong> (Required) - Phone or email
                  </li>
                  <li>
                    <strong>address</strong> (Optional) - Student's address
                  </li>
                  <li>
                    <strong>enrolled_date</strong> (Required) - YYYY-MM-DD
                    format
                  </li>
                  <li>
                    <strong>class_name</strong> (Optional) - Exact class name
                    from system
                  </li>
                </ul>
                <div className="mt-3">
                  <h5 className="font-medium text-blue-900 mb-1">
                    Available Classes:
                  </h5>
                  <p className="text-sm text-blue-700">
                    {availableClasses.map((cls) => cls.class_name).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Preview Import Data ({importData.length} students)
                </h3>
                {invalidClassCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ {invalidClassCount} student(s) have invalid class names
                    </p>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Admission No.</th>
                      <th className="px-4 py-2 text-left">First Name</th>
                      <th className="px-4 py-2 text-left">Last Name</th>
                      <th className="px-4 py-2 text-left">Gender</th>
                      <th className="px-4 py-2 text-left">Class</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importData.slice(0, 10).map((student, index) => (
                      <tr
                        key={index}
                        className={!student._classValid ? "bg-yellow-50" : ""}
                      >
                        <td className="px-4 py-2">
                          {student.admission_number}
                        </td>
                        <td className="px-4 py-2">{student.first_name}</td>
                        <td className="px-4 py-2">{student.last_name}</td>
                        <td className="px-4 py-2">{student.gender}</td>
                        <td className="px-4 py-2">
                          {student.class_name}
                          {!student._classValid && (
                            <span className="text-red-500 text-xs ml-2">
                              (Not found)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {!student._classValid ? (
                            <span className="text-yellow-600 text-xs">
                              Warning
                            </span>
                          ) : (
                            <span className="text-green-600 text-xs">
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... and {importData.length - 10} more students
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Import Results
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800">
                  <strong>Successfully imported:</strong> {results.success}{" "}
                  students
                </p>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">
                    Errors ({results.errors.length}):
                  </h4>
                  <div className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <p key={index}>
                        <strong>Row {error.row}:</strong> {error.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div>
            {step > 1 && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            {step === 2 && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {loading
                    ? "Importing..."
                    : `Import ${importData.length} Students`}
                </button>
              </>
            )}
            {step === 3 && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
              >
                Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStudentsModal;
