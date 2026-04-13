import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CogIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReportCardPreview from "../../components/report-cards/ReportCardPreview";
import axios from "axios";
import { useAcademicData } from "../../hooks/useAcademicContext"; // Import the hook
import api from "../../components/axiosconfig/axiosConfig";

const GenerateReportCards = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classStats, setClassStats] = useState({});
  const [formData, setFormData] = useState({
    class_id: "",
    issued_by: 1, // Default to admin user
  });
  const [generationResults, setGenerationResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const navigate = useNavigate();

  // Use the academic data hook
  const {
    academicYears,
    terms,
    selectedAcademicYear,
    selectedTerm,
    handleAcademicYearChange,
    handleTermChange,
    loading: academicLoading,
    error: academicError,
    getSelectedAcademicYear,
    getSelectedTerm,
  } = useAcademicData();

  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch class stats when selections change
  useEffect(() => {
    if (formData.class_id && selectedAcademicYear && selectedTerm) {
      fetchClassStats();
    }
  }, [formData.class_id, selectedAcademicYear, selectedTerm]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "/getclasses"
      );
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
    setLoading(false);
  };

  const fetchClassStats = async () => {
    if (!formData.class_id || !selectedAcademicYear || !selectedTerm) return;

    try {
      // Get student count in class
      const studentsRes = await api.get(
        `/getclasses/${formData.class_id}/students`
      );

      // Check for existing report cards
      const reportCardsRes = await api.get(
        `/getreportcards?class_id=${formData.class_id}&academic_year_id=${selectedAcademicYear}&term_id=${selectedTerm}`
      );

      setClassStats({
        studentCount: studentsRes.data.students?.length || 0,
        existingReportCards: reportCardsRes.data.length || 0,
        studentsWithGrades: 0, // We'll calculate this
      });
    } catch (error) {
      console.error("Error fetching class stats:", error);
    }
  };

  const handleGenerate = async () => {
    if (!formData.class_id || !selectedAcademicYear || !selectedTerm) {
      alert("Please select class, academic year, and term");
      return;
    }

    setGenerating(true);
    setGenerationResults(null);

    try {
      // Get term details first to include dates
      const termDetails = terms.find((t) => t.id == selectedTerm);

      const payload = {
        ...formData,
        academic_year_id: selectedAcademicYear,
        term_id: selectedTerm,
        // Include term dates if available
        term_start_date: termDetails?.start_date || null,
        term_end_date: termDetails?.end_date || null,
      };


      const response = await api.post(
        "/generatereportcards",
        payload
      );

      setGenerationResults(response.data);

      if (response.data.generated > 0) {
        alert(
          `Successfully generated ${response.data.generated} report cards!`
        );
      }

      // Refresh class stats after generation
      fetchClassStats();
    } catch (error) {
      console.error("Error generating report cards:", error);

      // Better error message
      if (error.response?.data?.error) {
        alert("Error generating report cards: " + error.response.data.error);
        console.error("Backend error details:", error.response.data);
      } else if (error.response?.data?.details) {
        alert("Error generating report cards: " + error.response.data.details);
      } else {
        alert("Error generating report cards: " + error.message);
      }
    }
    setGenerating(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (academicLoading) {
    return <LoadingSpinner text="Loading academic data..." />;
  }

  if (academicError) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Error Loading Academic Data</h2>
        <p>{academicError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const selectedYear = getSelectedAcademicYear();
  const selectedTermObj = getSelectedTerm();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Generate Report Cards
        </h1>
        <p className="text-gray-600">
          Generate report cards for students in a class based on their grades
        </p>
      </div>

      {/* Selected Academic Info */}
      {selectedYear && selectedTermObj && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-800">
                Currently selected:{" "}
                <span className="font-semibold">
                  {selectedYear.year_label} • {selectedTermObj.term_name}
                </span>
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {selectedYear.is_current && "✅ Current Academic Year • "}
                {new Date(selectedTermObj.start_date) <= new Date() &&
                  new Date(selectedTermObj.end_date) >= new Date() &&
                  "Current Term (Active Today)"}
              </p>
            </div>
            <button
              onClick={() => {
                handleAcademicYearChange("");
                handleTermChange("");
              }}
              className="text-xs text-emerald-700 hover:text-emerald-900"
            >
              Change Selection
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Generation Settings
            </h2>

            <div className="space-y-4">
              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <select
                  value={selectedAcademicYear || ""}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year_label} {year.is_current && "⭐"}
                    </option>
                  ))}
                </select>
                {selectedYear && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedYear.is_current
                      ? "Current year selected"
                      : `Year selected: ${selectedYear.year_label}`}
                  </p>
                )}
              </div>

              {/* Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term *
                </label>
                <select
                  value={selectedTerm || ""}
                  onChange={(e) => handleTermChange(e.target.value)}
                  disabled={!selectedAcademicYear}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value="">Select Term</option>
                  {terms.map((term) => {
                    const isCurrent =
                      new Date(term.start_date) <= new Date() &&
                      new Date(term.end_date) >= new Date();
                    return (
                      <option key={term.id} value={term.id}>
                        {term.term_name} {isCurrent}
                      </option>
                    );
                  })}
                </select>
                {selectedTermObj && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(selectedTermObj.start_date) <= new Date() &&
                    new Date(selectedTermObj.end_date) >= new Date()
                      ? "Current term (active today)"
                      : `Term selected: ${selectedTermObj.term_name}`}
                  </p>
                )}
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) =>
                    handleInputChange("class_id", e.target.value)
                  }
                  disabled={!selectedAcademicYear || !selectedTerm}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <option value="">Select Class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.class_name}{" "}
                      {classItem.room_number && `(${classItem.room_number})`}
                    </option>
                  ))}
                </select>
                {!selectedAcademicYear && (
                  <p className="text-xs text-amber-600 mt-1">
                    Please select academic year first
                  </p>
                )}
                {selectedAcademicYear && !selectedTerm && (
                  <p className="text-xs text-amber-600 mt-1">
                    Please select term
                  </p>
                )}
              </div>

              {/* Show selected info */}
              {selectedYear && selectedTermObj && formData.class_id && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">
                    Ready to generate report cards for:
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedYear.year_label} • {selectedTermObj.term_name} •{" "}
                    {classes.find((c) => c.id == formData.class_id)?.class_name}
                  </p>
                </div>
              )}

              {showPreview && selectedAcademicYear && selectedTerm && (
                <div className="mt-6">
                  <ReportCardPreview
                    classId={formData.class_id}
                    academicYearId={selectedAcademicYear}
                    termId={selectedTerm}
                  />
                </div>
              )}

              {/* Generate Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={
                    !formData.class_id || !selectedAcademicYear || !selectedTerm
                  }
                  className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={
                    generating ||
                    !formData.class_id ||
                    !selectedAcademicYear ||
                    !selectedTerm
                  }
                  className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CogIcon className="w-4 h-4" />
                  <span>
                    {generating ? "Generating..." : "Generate Report Cards"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {generationResults && (
            <div
              className={`mt-6 p-6 rounded-lg ${
                generationResults.errors && generationResults.errors.length > 0
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-3">Generation Results</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {generationResults.generated || 0}
                  </div>
                  <div className="text-sm text-gray-600">Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {generationResults.created || 0}
                  </div>
                  <div className="text-sm text-gray-600">New</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {generationResults.updated || 0}
                  </div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {generationResults.skipped || 0}
                  </div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
              </div>

              {generationResults.errors &&
                generationResults.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">
                      Errors ({generationResults.errors.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto">
                      {generationResults.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-sm text-yellow-700 p-2 border-b border-yellow-200"
                        >
                          <strong>{error.student}:</strong> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Statistics Panel */}
        <div className="space-y-6">
          {/* Class Info Card */}
          {formData.class_id && selectedAcademicYear && selectedTerm && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Class Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Total Students
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {classStats.studentCount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentChartBarIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Existing Report Cards
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {classStats.existingReportCards || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Academic Context
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    {selectedYear?.year_label} • {selectedTermObj?.term_name}
                  </span>
                </div>

                {classStats.existingReportCards > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Note:</strong> Existing report cards for this
                      class/term will be skipped. New report cards will only be
                      generated for students without existing ones.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              How It Works
            </h3>

            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <AcademicCapIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  <strong>Auto-selection:</strong> Current academic year and
                  term are selected automatically
                </span>
              </li>
              <li className="flex items-start">
                <CogIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>System calculates grades using grading scales</span>
              </li>
              <li className="flex items-start">
                <DocumentChartBarIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>Generates individual report cards for each student</span>
              </li>
              <li className="flex items-start">
                <UserGroupIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                <span>
                  Existing report cards are skipped to avoid duplicates
                </span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-white rounded border">
              <p className="text-xs text-gray-600">
                <strong>Requirements:</strong> Students must have scores entered
                for the selected term. Report cards are generated based on the
                grading scales you've defined.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => navigate("/academics/report-cards")}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  View All Report Cards
                </div>
                <div className="text-sm text-gray-600">
                  Browse generated report cards
                </div>
              </button>

              <button
                onClick={() => navigate("/academics/grades")}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Manage Scores</div>
                <div className="text-sm text-gray-600">
                  Enter or edit student scores
                </div>
              </button>

              <button
                onClick={() => navigate("/academics/grading-scales")}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Grading Scales</div>
                <div className="text-sm text-gray-600">
                  Configure grade calculations
                </div>
              </button>

              <button
                onClick={() => {
                  handleAcademicYearChange("");
                  handleTermChange("");
                  setFormData({ class_id: "", issued_by: 1 });
                }}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  Reset Selections
                </div>
                <div className="text-sm text-gray-600">
                  Clear all filters and start over
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportCards;