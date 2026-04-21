import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, PlusIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAcademicData } from "../../hooks/useAcademicContext";
import api from "../../components/axiosconfig/axiosConfig";

const AttendanceList = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    class_id: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });

  const navigate = useNavigate();

  // Use the academic data hook - it auto-selects everything!
  const {
    academicYears,
    terms,
    selectedAcademicYear,
    selectedTerm,
    handleAcademicYearChange,
    handleTermChange,
    getSelectedAcademicYear,
    getSelectedTerm,
    loading: academicLoading,
  } = useAcademicData();

  // Get selected objects
  const selectedYear = getSelectedAcademicYear();
  const selectedTermObj = getSelectedTerm();

  useEffect(() => {
    fetchClasses();
  }, []);

  // Update filters automatically when academic selections are ready
  useEffect(() => {
    if (selectedAcademicYear && selectedTerm) {
      const newFilters = {
        ...filters,
        academic_year_id: selectedAcademicYear,
        term_id: selectedTerm,
      };
      setFilters(newFilters);
    }
  }, [selectedAcademicYear, selectedTerm]);

  // Fetch attendance when class is selected AND academic data is ready
  useEffect(() => {
    if (filters.class_id && selectedAcademicYear) {
      fetchAttendanceData();
    }
  }, [filters.class_id, selectedAcademicYear, selectedTerm]);

  const fetchClasses = async () => {
    try {
      const classesRes = await api.get("/getclasses");
      setClasses(classesRes.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!filters.class_id || !selectedAcademicYear) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Use the already selected values
      params.append("class_id", filters.class_id);
      params.append("academic_year_id", selectedAcademicYear);
      params.append("term_id", selectedTerm || "");
      params.append("start_date", filters.start_date);
      params.append("end_date", filters.end_date);

      const [recordsRes, statsRes] = await Promise.all([
        api.get(`/attendance/records?${params}`),
        api.get(`/attendance/statistics?${params}`),
      ]);

      setAttendanceRecords(recordsRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
    setLoading(false);
  };

  const handleTakeAttendance = () => {
    if (!filters.class_id) {
      alert("Please select a class first");
      return;
    }

    navigate(
      `/academics/attendance/take?class_id=${filters.class_id}&academic_year_id=${selectedAcademicYear}&term_id=${selectedTerm}`,
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      Present: "bg-green-100 text-green-800",
      Absent: "bg-red-100 text-red-800",
      Late: "bg-yellow-100 text-yellow-800",
      Excused: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (academicLoading) {
    return <LoadingSpinner text="Loading academic year and term..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="text-gray-600">Track and manage student attendance</p>
        </div>
        <button
          onClick={handleTakeAttendance}
          disabled={!filters.class_id}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Take Attendance</span>
        </button>
      </div>

      {/* Filters - Already pre-selected! */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, class_id: e.target.value }))
              }
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
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label}
                  {year.is_current && " (Current)"}
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
              onChange={(e) => handleTermChange(e.target.value)}
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

        {/* Show what's auto-selected */}
        {selectedYear && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              <span className="font-medium">selected:</span>{" "}
              {selectedYear.year_label} •{" "}
              {selectedTermObj?.term_name || "No term selected"}
            </p>
            {selectedYear.is_current && (
              <p className="text-xs text-green-600 mt-1">
                Current (academic year - term) selected
              </p>
            )}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics.total_records > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.total_students || 0}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-green-600">
              {statistics.present_count || 0}
            </div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-red-600">
              {statistics.absent_count || 0}
            </div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.late_count || 0}
            </div>
            <div className="text-sm text-gray-600">Late</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.present_percentage || 0}%
            </div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Attendance Records
          </h2>
          <p className="text-sm text-gray-600">
            {attendanceRecords.length} records found
          </p>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading attendance records..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {record.first_name[0]}
                            {record.last_name[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.first_name} {record.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.admission_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {record.notes || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.recorded_by_name || "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {attendanceRecords.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Attendance Records
                </h3>
                <p className="text-gray-500 mb-4">
                  {filters.class_id
                    ? "No attendance records found for the selected filters."
                    : "Select a class to view attendance records."}
                </p>
                <button
                  onClick={handleTakeAttendance}
                  disabled={!filters.class_id}
                  className="inline-flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Take Attendance</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
