import React, { useState, useEffect } from "react";
import { DocumentChartBarIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAcademicData } from "../../hooks/useAcademicContext"; // Import the hook
import api from "../../components/axiosconfig/axiosConfig";

const AttendanceReports = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    class_id: "",
    report_type: "daily_summary", // daily_summary, monthly_summary, student_wise
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

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

  // Update filters when academic year or term changes
  useEffect(() => {
    if (selectedAcademicYear) {
      setFilters((prev) => ({
        ...prev,
        academic_year_id: selectedAcademicYear,
      }));
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedTerm) {
      setFilters((prev) => ({
        ...prev,
        term_id: selectedTerm,
      }));
    }
  }, [selectedTerm]);

  const fetchClasses = async () => {
    try {
      const classesRes = await api.get("/getclasses");
      setClasses(classesRes.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const generateReport = async () => {
    if (!filters.class_id) {
      alert("Please select a class");
      return;
    }

    if (!filters.academic_year_id || !filters.term_id) {
      alert("Please select both academic year and term");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/attendance/reports?${params}`);
      setReportData(response.data);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(
        "Error generating report: " +
          (error.response?.data?.error || error.message),
      );
    }
    setLoading(false);
  };

  const exportReport = async (format) => {
    if (!reportData) {
      alert("Please generate a report first");
      return;
    }

    setGenerating(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
      params.append("format", format);

      const response = await api.get(`/attendance/export?${params}`, {
        responseType: "blob",
        timeout: 30000, // 30 second timeout
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const className =
        classes.find((c) => c.id == filters.class_id)?.class_name ||
        "attendance";
      const extension = format === "excel" ? "xlsx" : "pdf";

      // Get selected academic year and term for filename
      const selectedYear = getSelectedAcademicYear();
      const selectedTermObj = getSelectedTerm();
      const yearLabel =
        selectedYear?.year_label?.replace(/\s+/g, "-") || "year";
      const termName =
        selectedTermObj?.term_name?.replace(/\s+/g, "-") || "term";

      link.setAttribute(
        "download",
        `attendance-report-${className}-${yearLabel}-${termName}-${filters.report_type}.${extension}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);

      if (error.response?.data?.error) {
        alert(`Export failed: ${error.response.data.error}`);
      } else if (error.code === "ECONNABORTED") {
        alert("Export timed out. Please try again with a smaller date range.");
      } else {
        alert("Error exporting report. Please check the console for details.");
      }
    }
    setGenerating(false);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBgColor = (percentage) => {
    if (percentage >= 90) return "bg-green-100";
    if (percentage >= 75) return "bg-yellow-100";
    return "bg-red-100";
  };

  // Handle year change with reset
  const handleYearChange = (yearId) => {
    handleAcademicYearChange(yearId);
    // Clear report when year changes
    setReportData(null);
  };

  // Handle term change with reset
  const handleTermChangeWithReset = (termId) => {
    handleTermChange(termId);
    // Clear report when term changes
    setReportData(null);
  };

  // Get selected academic info for display
  const selectedYear = getSelectedAcademicYear();
  const selectedTermObj = getSelectedTerm();

  if (academicLoading)
    return <LoadingSpinner text="Loading academic data..." />;
  if (academicError)
    return <div className="text-red-600 p-6">Error: {academicError}</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Reports
          </h1>
          <p className="text-gray-600">
            Generate detailed attendance reports and analytics
          </p>
        </div>

        {/* Export buttons */}
        {reportData && !loading && (
          <div className="flex space-x-3">
            <button
              onClick={() => exportReport("excel")}
              disabled={generating}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {generating ? (
                "Exporting..."
              ) : (
                <>
                  <span>Export Excel</span>
                </>
              )}
            </button>
            <button
              onClick={() => exportReport("pdf")}
              disabled={generating}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {generating ? (
                "Exporting..."
              ) : (
                <>
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Selected Academic Info */}
      {selectedYear && selectedTermObj && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Selected Academic Period:</span>{" "}
                {selectedYear.year_label} • Term {selectedTermObj.term_name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {selectedYear.is_current && "⭐ Current Academic Year"}
                {selectedTermObj.start_date && selectedTermObj.end_date && (
                  <span>
                    {selectedYear.is_current && " • "}
                    📅{" "}
                    {new Date(
                      selectedTermObj.start_date,
                    ).toLocaleDateString()}{" "}
                    - {new Date(selectedTermObj.end_date).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report Filters */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Report Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={filters.report_type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, report_type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="daily_summary">Daily Summary</option>
              <option value="monthly_summary">Monthly Summary</option>
              <option value="student_wise">Student-wise Report</option>
              <option value="trend_analysis">Trend Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, class_id: e.target.value }));
                setReportData(null); // Clear report when class changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Class</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear || ""}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label} {year.is_current && "(Current)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              value={selectedTerm || ""}
              onChange={(e) => handleTermChangeWithReset(e.target.value)}
              disabled={!selectedAcademicYear}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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

        {/* Dynamic filters based on report type */}
        {filters.report_type === "daily_summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {filters.report_type === "monthly_summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, month: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, year: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center space-x-4">
          <button
            onClick={generateReport}
            disabled={
              loading ||
              !filters.class_id ||
              !selectedAcademicYear ||
              !selectedTerm
            }
            className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <DocumentChartBarIcon className="w-5 h-5" />
            <span>{loading ? "Generating..." : "Generate Report"}</span>
          </button>

          {reportData && (
            <div className="text-sm text-gray-600">
              Report ready for {reportData.class_name}
            </div>
          )}
        </div>
      </div>

      {/* Report Results */}
      {loading && <LoadingSpinner text="Generating report..." />}

      {reportData && !loading && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {reportData.report_title}
                </h2>
                <p className="text-gray-600">{reportData.report_period}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Generated on {new Date().toLocaleDateString()} at{" "}
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {reportData.class_name}
                </p>
                <p className="text-sm text-gray-600">
                  {reportData.total_students} students • {reportData.total_days}{" "}
                  days
                </p>
                {selectedYear && selectedTermObj && (
                  <p className="text-xs text-blue-600 mt-1">
                    {selectedYear.year_label} • Term {selectedTermObj.term_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rest of your report display components remain the same */}
          {/* Summary Statistics */}
          {reportData.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border text-center">
                <div className="text-2xl font-bold text-green-600">
                  {reportData.summary.present_percentage}%
                </div>
                <div className="text-sm text-gray-600">Overall Attendance</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.summary.average_daily_attendance}
                </div>
                <div className="text-sm text-gray-600">
                  Avg Daily Attendance
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.summary.most_absent_student_count}
                </div>
                <div className="text-sm text-gray-600">Most Absences</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.summary.perfect_attendance_count}
                </div>
                <div className="text-sm text-gray-600">Perfect Attendance</div>
              </div>
            </div>
          )}

          {/* Student-wise Report */}
          {filters.report_type === "student_wise" && reportData.students && (
            <div className="bg-white rounded-lg shadow border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Student-wise Attendance
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Excused
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance %
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                {student.first_name[0]}
                                {student.last_name[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.admission_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">
                          {student.present_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-semibold">
                          {student.absent_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 font-semibold">
                          {student.late_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600 font-semibold">
                          {student.excused_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(
                              student.attendance_percentage,
                            )} ${getStatusColor(
                              student.attendance_percentage,
                            )}`}
                          >
                            {student.attendance_percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {student.attendance_percentage >= 90 ? (
                            <span className="text-green-600">Excellent</span>
                          ) : student.attendance_percentage >= 75 ? (
                            <span className="text-yellow-600">Good</span>
                          ) : (
                            <span className="text-red-600">
                              Needs Improvement
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Summary Report */}
          {filters.report_type === "daily_summary" &&
            reportData.daily_summary && (
              <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Daily Attendance Summary
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Late
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Excused
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.daily_summary.map((day, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">
                            {day.present_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-semibold">
                            {day.absent_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 font-semibold">
                            {day.late_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600 font-semibold">
                            {day.excused_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(
                                day.attendance_rate,
                              )} ${getStatusColor(day.attendance_rate)}`}
                            >
                              {day.attendance_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Trend Analysis Report */}
          {filters.report_type === "trend_analysis" &&
            reportData.trend_analysis && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow border text-center">
                    <div
                      className={`text-2xl font-bold ${
                        reportData.summary?.overall_trend === "Improving"
                          ? "text-green-600"
                          : reportData.summary?.overall_trend === "Declining"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {reportData.summary?.overall_trend || "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">Overall Trend</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.summary?.improving_students || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Improving Students
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.summary?.declining_students || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Declining Students
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow border text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary?.stable_students || 0}
                    </div>
                    <div className="text-sm text-gray-600">Stable Students</div>
                  </div>
                </div>

                {/* Weekly Trends */}
                {reportData.trend_analysis.weekly_trends.length > 0 && (
                  <div className="bg-white rounded-lg shadow border">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Weekly Trends
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Week
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Period
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Present
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Absent
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance Rate
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trend
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.trend_analysis.weekly_trends.map(
                            (week, index, array) => {
                              const prevWeek = array[index - 1];
                              const trend = prevWeek
                                ? week.attendance_rate -
                                  prevWeek.attendance_rate
                                : 0;

                              return (
                                <tr
                                  key={week.week_number}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Week {week.week_number}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(
                                      week.week_start,
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                      week.week_end,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">
                                    {week.present_count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-semibold">
                                    {week.absent_count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(
                                        week.attendance_rate,
                                      )} ${getStatusColor(
                                        week.attendance_rate,
                                      )}`}
                                    >
                                      {week.attendance_rate}%
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {trend > 0 ? (
                                      <span className="text-green-600 text-sm font-semibold">
                                        ↑ +{trend.toFixed(1)}%
                                      </span>
                                    ) : trend < 0 ? (
                                      <span className="text-red-600 text-sm font-semibold">
                                        ↓ {trend.toFixed(1)}%
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-sm">
                                        → Stable
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Day of Week Trends */}
                {reportData.trend_analysis.day_of_week_trends.length > 0 && (
                  <div className="bg-white rounded-lg shadow border">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Day of Week Analysis
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Day
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Present
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Absent
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Late
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.trend_analysis.day_of_week_trends.map(
                            (day) => (
                              <tr
                                key={day.day_name}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {day.day_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-semibold">
                                  {day.present_count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-semibold">
                                  {day.absent_count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 font-semibold">
                                  {day.late_count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(
                                      day.attendance_rate,
                                    )} ${getStatusColor(day.attendance_rate)}`}
                                  >
                                    {day.attendance_rate}%
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Student Trends */}
                {reportData.trend_analysis.student_trends.length > 0 && (
                  <div className="bg-white rounded-lg shadow border">
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Student Performance Trends
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Avg Attendance
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trend Change
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trend Direction
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.trend_analysis.student_trends.map(
                            (student) => (
                              <tr
                                key={student.student_id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-gray-600 text-sm font-medium">
                                        {student.first_name[0]}
                                        {student.last_name[0]}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {student.first_name} {student.last_name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {student.admission_number}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(
                                      student.avg_attendance,
                                    )} ${getStatusColor(
                                      student.avg_attendance,
                                    )}`}
                                  >
                                    {student.avg_attendance.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                                  {student.trend_change > 0 ? (
                                    <span className="text-green-600">
                                      +{student.trend_change.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-red-600">
                                      {student.trend_change.toFixed(1)}%
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      student.trend_direction === "Improving"
                                        ? "bg-green-100 text-green-800"
                                        : student.trend_direction ===
                                            "Declining"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {student.trend_direction}
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Monthly Summary */}
          {filters.report_type === "monthly_summary" &&
            reportData.monthly_summary && (
              <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Monthly Summary -{" "}
                    {new Date(2000, filters.month - 1).toLocaleString(
                      "default",
                      { month: "long" },
                    )}{" "}
                    {filters.year}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Attendance Overview
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Total School Days:
                          </span>
                          <span className="font-semibold">
                            {reportData.monthly_summary.total_days}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Average Daily Attendance:
                          </span>
                          <span className="font-semibold">
                            {reportData.monthly_summary.avg_daily_attendance}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Students with Perfect Attendance:
                          </span>
                          <span className="font-semibold text-green-600">
                            {
                              reportData.monthly_summary
                                .perfect_attendance_count
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Students Below 75%:
                          </span>
                          <span className="font-semibold text-red-600">
                            {reportData.monthly_summary.low_attendance_count}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Attendance Distribution
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">90-100%</span>
                          <span className="font-semibold text-green-600">
                            {reportData.monthly_summary.distribution.excellent}{" "}
                            students
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">75-89%</span>
                          <span className="font-semibold text-yellow-600">
                            {reportData.monthly_summary.distribution.good}{" "}
                            students
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Below 75%</span>
                          <span className="font-semibold text-red-600">
                            {reportData.monthly_summary.distribution.poor}{" "}
                            students
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;
