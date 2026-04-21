import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import autoTable from "jspdf-autotable";
import api from "../../components/axiosconfig/axiosConfig";
import { useAuth } from "../contexts/AuthContext";

const TakeAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // History and export states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previousAttendance, setPreviousAttendance] = useState([]);

  // Get class_id from URL params
  const queryParams = new URLSearchParams(location.search);
  const classId = queryParams.get("class_id");

  const user = useAuth();

  useEffect(() => {
    if (classId) {
      fetchClassStudents();
      fetchPreviousAttendance();
    } else {
      alert("No class selected");
      navigate("/academics/attendance");
    }
  }, [classId, attendanceDate]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchTerm, statusFilter]);

  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      // Get class info
      const classRes = await api.get(`/getclasses/${classId}/students`);
      setClassInfo(classRes.data);

      // Get students for attendance
      const attendanceRes = await api.get(
        `/attendance/class/${classId}?date=${attendanceDate}`,
      );

      setStudents(attendanceRes.data.students || attendanceRes.data);

      if (attendanceRes.data.academic_year_id) {
        setClassInfo((prev) => ({
          ...prev,
          academic_year_id: attendanceRes.data.academic_year_id,
        }));
      }
      if (attendanceRes.data.term_id) {
        setClassInfo((prev) => ({
          ...prev,
          term_id: attendanceRes.data.term_id,
        }));
      }
    } catch (error) {
      console.error("Error fetching class students:", error);
      alert("Error loading students for attendance");
    }
    setLoading(false);
  };

  const fetchPreviousAttendance = async () => {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekDate = lastWeek.toISOString().split("T")[0];

      const response = await api.get(
        `/attendance/records?class_id=${classId}&start_date=${lastWeekDate}&end_date=${attendanceDate}`,
      );

      if (response.data && response.data.length > 0) {
        // Group by date to show last few attendance records
        const groupedByDate = response.data.reduce((acc, record) => {
          if (!acc[record.date]) {
            acc[record.date] = [];
          }
          acc[record.date].push(record);
          return acc;
        }, {});

        // Get unique dates sorted descending
        const uniqueDates = Object.keys(groupedByDate)
          .sort((a, b) => new Date(b) - new Date(a))
          .slice(0, 3); // Show last 3 days

        setPreviousAttendance(
          uniqueDates.map((date) => ({
            date,
            records: groupedByDate[date],
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching previous attendance:", error);
    }
  };

  const updateStudentStatus = (studentId, status) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, attendance_status: status }
          : student,
      ),
    );
  };

  const updateStudentNotes = (studentId, notes) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, attendance_notes: notes }
          : student,
      ),
    );
  };

  const handleBulkStatus = (status) => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        attendance_status: status,
      })),
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      Present: "bg-green-100 text-green-800 border-green-200",
      Absent: "bg-red-100 text-red-800 border-red-200",
      Late: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Excused: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Filter students based on search and status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || student.attendance_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handleSaveAttendance = async () => {
    if (!classId) return;

    setSaving(true);
    try {
      const recorded_by = user.id || 1;

      // Get current academic year
      let academic_year_id;
      try {
        const yearsResponse = await api.get("/getacademicyears");
        const currentYear = yearsResponse.data.find((year) => year.is_current);
        if (currentYear) {
          academic_year_id = currentYear.id;
        } else if (yearsResponse.data.length > 0) {
          academic_year_id = yearsResponse.data[0].id;
        } else {
          throw new Error("No academic years found in the system");
        }
      } catch (error) {
        console.error("Error getting academic year:", error);
        alert("Error: Could not determine academic year.");
        setSaving(false);
        return;
      }

      // Get current term
      let term_id = 1;
      try {
        const termsResponse = await api.get("/getterms");
        const currentTerm = termsResponse.data.find((term) => {
          const today = new Date();
          const startDate = new Date(term.start_date);
          const endDate = new Date(term.end_date);
          return startDate <= today && endDate >= today;
        });
        if (currentTerm) {
          term_id = currentTerm.id;
        } else if (termsResponse.data.length > 0) {
          term_id = termsResponse.data[0].id;
        }
      } catch (error) {
        console.error("Error getting current term:", error);
      }

      // Prepare attendance data
      const attendance_data = students.map((student) => ({
        student_id: student.id,
        status: student.attendance_status,
        notes: student.attendance_notes || "",
      }));

      // const response = await api.post("/attendance/bulk", {
      //   attendance_data,
      //   academic_year_id,
      //   term_id,
      //   date: attendanceDate,
      //   recorded_by,
      // });

      alert("Attendance saved successfully!");
      fetchPreviousAttendance(); // Refresh previous attendance
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert(
        "Error saving attendance: " +
          (error.response?.data?.error || error.message),
      );
    }
    setSaving(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(18);
    doc.text(`Attendance Record - ${classInfo?.class_name || "Class"}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${attendanceDate}`, 14, 30);
    doc.text(`Total Students: ${students.length}`, 14, 38);

    // Add summary
    const summary = {
      Present: students.filter((s) => s.attendance_status === "Present").length,
      Absent: students.filter((s) => s.attendance_status === "Absent").length,
      Late: students.filter((s) => s.attendance_status === "Late").length,
      Excused: students.filter((s) => s.attendance_status === "Excused").length,
    };

    doc.setFontSize(11);
    doc.text("Summary:", 14, 50);
    doc.text(`Present: ${summary.Present}`, 14, 58);
    doc.text(`Absent: ${summary.Absent}`, 14, 66);
    doc.text(`Late: ${summary.Late}`, 14, 74);
    doc.text(`Excused: ${summary.Excused}`, 14, 82);

    // Add table
    const tableData = students.map((student) => [
      student.admission_number,
      `${student.first_name} ${student.last_name}`,
      student.attendance_status,
      student.attendance_notes || "",
    ]);

    // Add attendance rate to summary
    const attendanceRate = students.length
      ? ((summary.Present / students.length) * 100).toFixed(1)
      : "0.0";

    doc.text(`Attendance Rate: ${attendanceRate}%`, 14, 90);

    // Add table using the autotable helper
    autoTable(doc, {
      startY: 100,
      head: [["Admission No", "Student Name", "Status", "Notes"]],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [239, 239, 239] },
    });

    // with

    // Save the PDF
    doc.save(`attendance-${classInfo?.class_name}-${attendanceDate}.pdf`);
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = students.map((student) => ({
      "Admission Number": student.admission_number,
      "First Name": student.first_name,
      "Last Name": student.last_name,
      Status: student.attendance_status,
      Notes: student.attendance_notes || "",
      Date: attendanceDate,
      Class: classInfo?.class_name,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    // Add summary sheet
    const summaryData = [
      {
        "Total Students": students.length,
        Present: students.filter((s) => s.attendance_status === "Present")
          .length,
        Absent: students.filter((s) => s.attendance_status === "Absent").length,
        Late: students.filter((s) => s.attendance_status === "Late").length,
        Excused: students.filter((s) => s.attendance_status === "Excused")
          .length,
        "Attendance Rate": `${(
          (students.filter((s) => s.attendance_status === "Present").length /
            students.length) *
          100
        ).toFixed(1)}%`,
      },
    ];

    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");

    XLSX.writeFile(
      wb,
      `attendance-${classInfo?.class_name}-${attendanceDate}.xlsx`,
    );
  };

  // View student attendance history
  const viewStudentHistory = async (student) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    try {
      const response = await api.get(
        `/attendance/records?student_id=${
          student.id
        }&start_date=${getOneMonthAgo()}&end_date=${attendanceDate}`,
      );
      setStudentHistory(response.data || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error fetching student history:", error);
    }
    setLoadingHistory(false);
  };

  const getOneMonthAgo = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  };

  if (loading) {
    return <LoadingSpinner text="Loading students..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/academics/attendance")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Take Attendance
            </h1>
            <p className="text-gray-600">
              {classInfo?.class_name} • {students.length} students
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exportToPDF()}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => exportToExcel()}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <CheckIcon className="w-5 h-5" />
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Previous Attendance Summary */}
      {previousAttendance.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Previous Attendance
            </h3>
            <span className="text-sm text-blue-600">
              Last {previousAttendance.length} days
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {previousAttendance.map((day) => {
              const presentCount = day.records.filter(
                (r) => r.status === "Present",
              ).length;
              const attendanceRate = (
                (presentCount / day.records.length) *
                100
              ).toFixed(1);

              return (
                <div key={day.date} className="bg-white rounded-lg border p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        attendanceRate >= 90
                          ? "bg-green-100 text-green-800"
                          : attendanceRate >= 75
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {attendanceRate}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>P: {presentCount}</span>
                    <span>
                      A:{" "}
                      {day.records.filter((r) => r.status === "Absent").length}
                    </span>
                    <span>
                      L: {day.records.filter((r) => r.status === "Late").length}
                    </span>
                    <span>
                      E:{" "}
                      {day.records.filter((r) => r.status === "Excused").length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["Present", "Absent", "Late", "Excused"].map((status) => (
          <button
            key={status}
            onClick={() => handleBulkStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium ${
              status === "Present"
                ? "bg-green-500 hover:bg-green-600"
                : status === "Absent"
                  ? "bg-red-500 hover:bg-red-600"
                  : status === "Late"
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            Mark All {status}
          </button>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  {/* Student Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-indigo-800 font-medium">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.admission_number}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(
                        student.attendance_status,
                      )}`}
                    >
                      {student.attendance_status}
                    </span>
                  </td>

                  {/* Notes */}
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={student.attendance_notes || ""}
                      onChange={(e) =>
                        updateStudentNotes(student.id, e.target.value)
                      }
                      className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Add notes..."
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => viewStudentHistory(student)}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>History</span>
                    </button>
                  </td>

                  {/* Quick Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {["Present", "Absent", "Late", "Excused"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() =>
                              updateStudentStatus(student.id, status)
                            }
                            className={`px-2 py-1 text-xs rounded ${
                              student.attendance_status === status
                                ? "text-white " +
                                  (status === "Present"
                                    ? "bg-green-500"
                                    : status === "Absent"
                                      ? "bg-red-500"
                                      : status === "Late"
                                        ? "bg-yellow-500"
                                        : "bg-blue-500")
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {status.charAt(0)}
                          </button>
                        ),
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {currentStudents.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No students found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "No students match your current filters."
                : "No students available for this class."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>

          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredStudents.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredStudents.length}</span>{" "}
                students
              </p>
            </div>

            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? "z-10 bg-emerald-50 border-emerald-500 text-emerald-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {students.filter((s) => s.attendance_status === "Present").length}
          </div>
          <div className="text-sm text-green-600">Present</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">
            {students.filter((s) => s.attendance_status === "Absent").length}
          </div>
          <div className="text-sm text-red-600">Absent</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {students.filter((s) => s.attendance_status === "Late").length}
          </div>
          <div className="text-sm text-yellow-600">Late</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {students.filter((s) => s.attendance_status === "Excused").length}
          </div>
          <div className="text-sm text-blue-600">Excused</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {students.length > 0
              ? `${(
                  (students.filter((s) => s.attendance_status === "Present")
                    .length /
                    students.length) *
                  100
                ).toFixed(1)}%`
              : "0%"}
          </div>
          <div className="text-sm text-purple-600">Attendance Rate</div>
        </div>
      </div>

      {/* Student History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Attendance History
                  </h2>
                  <p className="text-gray-600">
                    {selectedStudent?.first_name} {selectedStudent?.last_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {loadingHistory ? (
                <LoadingSpinner text="Loading history..." />
              ) : studentHistory.length > 0 ? (
                <div className="overflow-y-auto max-h-[60vh]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Notes
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Recorded By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentHistory.map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                record.status,
                              )}`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{record.notes || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {record.recorded_by_name || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance history found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeAttendance;
