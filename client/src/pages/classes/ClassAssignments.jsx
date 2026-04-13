import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  UserPlusIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ClassAssignmentForm from "../../components/classes/ClassAssignmentForm";
import BulkClassAssignmentForm from "../../components/classes/BulkClassAssignmentForm";
import ClassAssignmentTable from "../../components/classes/ClassAssignmentTable";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const ClassAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [enrollmentType, setEnrollmentType] = useState("single"); // 'single' or 'bulk'

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    class_id: "",
    academic_year_id: "",
    sort_by: "student_name",
    sort_order: "asc",
  });

  // View mode: 'all' or 'class'
  const [viewMode, setViewMode] = useState("all");
  const [selectedClass, setSelectedClass] = useState(null);

  const getData = async () => {
    setLoading(true);
    try {
      // For dropdowns, fetch all data without pagination
      const [studentsRes, classesRes, yearsRes, termsRes] = await Promise.all([
        api.get("/getstudents", {
          params: { limit: 1000 },
        }),
        api.get("/getclasses", {
          params: { limit: 100 },
        }),
        api.get("/getacademicyears"),
        api.get("/getterms"),
      ]);

      setStudents(studentsRes.data.students || studentsRes.data || []);
      setClasses(classesRes.data);
      setAcademicYears(yearsRes.data);
      setTerms(termsRes.data);

      // Fetch assignments with current filters
      await fetchAssignments();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const fetchAssignments = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      // If in class view mode and a class is selected, filter by that class
      if (viewMode === "class" && selectedClass) {
        params.class_id = selectedClass.id;
      }

      const response = await api.get("/getclassassignments", { params });

      setAssignments(response.data.assignments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Fetch assignments when filters or pagination changes
  useEffect(() => {
    if (!loading) {
      fetchAssignments();
    }
  }, [pagination.page, filters, viewMode, selectedClass]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      class_id: "",
      academic_year_id: "",
      sort_by: "student_name",
      sort_order: "asc",
    });
    setSelectedClass(null);
    setViewMode("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClassClick = (classItem) => {
    setSelectedClass(classItem);
    setViewMode("class");
    setFilters((prev) => ({ ...prev, class_id: classItem.id }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewAll = () => {
    setSelectedClass(null);
    setViewMode("all");
    setFilters((prev) => ({ ...prev, class_id: "" }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Other handlers remain the same...
  const handleAddAssignment = (type = "single") => {
    setEnrollmentType(type);
    setEditingAssignment(null);
    if (type === "bulk") {
      setIsBulkModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this student from the class?",
      )
    ) {
      try {
        await api.delete(`/deleteclassassignment/${assignmentId}`);
        fetchAssignments(); // Refresh assignments
      } catch (error) {
        console.error("Error deleting class assignment:", error);
      }
    }
  };

  const handlePromoteStudent = async (assignmentId, newClassId) => {
    if (window.confirm("Are you sure you want to promote this student?")) {
      try {
        await api.put(`/promotestudent/${assignmentId}`, {
          new_class_id: newClassId,
        });
        fetchAssignments(); // Refresh assignments
      } catch (error) {
        console.error("Error promoting student:", error);
      }
    }
  };

  const handleSaveAssignment = async (assignmentData) => {
    try {
      if (editingAssignment) {
        await api.put(
          `/updateclassassignment/${editingAssignment.id}`,
          assignmentData,
        );
      } else {
        await api.post("/createclassassignment", assignmentData);
      }
      setIsModalOpen(false);
      fetchAssignments(); // Refresh assignments
    } catch (error) {
      console.error("Error saving class assignment:", error);
    }
  };

  // function for bulk enrollment
  const handleBulkEnrollment = async (bulkData) => {
    try {
      const response = await api.post("/createclassassignment-bulk", bulkData);

      // Show success message with details
      alert(`
          Bulk enrollment completed!

          Successfully enrolled: ${response.data.created} students
          Skipped (already enrolled): ${response.data.skipped} students
          Errors: ${response.data.errors.length - response.data.skipped}

          ${response.data.message}
        `);

      setIsBulkModalOpen(false);
      getData(); // Refresh data
    } catch (error) {
      console.error("Error in bulk enrollment:", error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // Get available students for selected academic year
  const getAvailableStudents = () => {
    const selectedYear = filters.academic_year_id || "";

    if (!selectedYear) return students.filter((s) => s.is_active !== false);

    return students.filter((student) => {
      const hasAssignment = assignments.some(
        (assignment) =>
          assignment.student_id === student.id &&
          assignment.academic_year_id == selectedYear,
      );
      return !hasAssignment && student.is_active !== false;
    });
  };

  // Filter assignments by selected academic year
  const filteredAssignments = selectedYear
    ? assignments.filter(
        (assignment) => assignment.academic_year_id == selectedYear,
      )
    : assignments;

  if (loading && pagination.page === 1) {
    return <LoadingSpinner text="Loading class assignments..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Class Assignments
          </h1>
          <p className="text-gray-600">
            Manage student enrollment and class placements for academic years
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleAddAssignment("single")}
            className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Enroll Student</span>
          </button>
          <button
            onClick={() => handleAddAssignment("bulk")}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Bulk Enroll</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          <button
            onClick={handleViewAll}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewMode === "all"
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            <span>All Students</span>
          </button>
          <button
            onClick={() => setViewMode("class")}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              viewMode === "class"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <BuildingLibraryIcon className="w-5 h-5" />
            <span>View by Class</span>
          </button>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.class_id || filters.academic_year_id) && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Search: "{filters.search}"
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.class_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                Class:{" "}
                {classes.find((c) => c.id == filters.class_id)?.class_name ||
                  "Selected"}
                <button
                  onClick={() => handleFilterChange("class_id", "")}
                  className="ml-1 text-emerald-600 hover:text-emerald-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.academic_year_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Year:{" "}
                {academicYears.find((y) => y.id == filters.academic_year_id)
                  ?.year_label || "Selected"}
                <button
                  onClick={() => handleFilterChange("academic_year_id", "")}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Class Cards (shown when in class view mode) */}
      {viewMode === "class" && !selectedClass && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select a Class
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {classes.map((classItem) => {
              // Count students in this class for current academic year
              const studentCount = assignments.filter(
                (a) => a.class_id === classItem.id,
              ).length;

              return (
                <div
                  key={classItem.id}
                  onClick={() => handleClassClick(classItem)}
                  className="bg-white p-4 rounded-lg shadow border cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {classItem.class_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Room: {classItem.room_number || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">
                        {studentCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {classItem.capacity
                          ? `${studentCount}/${classItem.capacity}`
                          : "students"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs">
                    <div
                      className={`inline-block px-2 py-1 rounded-full ${
                        classItem.capacity && studentCount >= classItem.capacity
                          ? "bg-red-100 text-red-800"
                          : classItem.capacity &&
                              studentCount >= classItem.capacity * 0.8
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {classItem.capacity
                        ? `${Math.round(
                            (studentCount / classItem.capacity) * 100,
                          )}% full`
                        : "No capacity set"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Class Header */}
      {viewMode === "class" && selectedClass && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back to Classes
                </button>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedClass.class_name}
                </h3>
                {selectedClass.room_number && (
                  <span className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded">
                    Room: {selectedClass.room_number}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                Viewing students in this class. Click on another class above to
                switch.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">
                {assignments.length}
              </div>
              <div className="text-sm text-gray-500">Students in class</div>
              {selectedClass.capacity && (
                <div className="text-xs text-gray-500">
                  Capacity: {assignments.length}/{selectedClass.capacity}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search by name or admission..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) => handleFilterChange("class_id", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year
            </label>
            <select
              value={filters.academic_year_id}
              onChange={(e) =>
                handleFilterChange("academic_year_id", e.target.value)
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              <option value="">All Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label} {year.is_current ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <div className="flex space-x-2">
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange("sort_by", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="student_name">Student Name</option>
                <option value="admission_number">Admission Number</option>
                <option value="class_name">Class Name</option>
                <option value="date_assigned">Enrollment Date</option>
              </select>
              <select
                value={filters.sort_order}
                onChange={(e) =>
                  handleFilterChange("sort_order", e.target.value)
                }
                className="block w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Total Enrollments</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          <p className="text-xs text-gray-500">Across all years</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Showing</p>
          <p className="text-2xl font-bold text-gray-900">
            {assignments.length}
          </p>
          <p className="text-xs text-gray-500">On this page</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Available Students</p>
          <p className="text-2xl font-bold text-gray-900">
            {getAvailableStudents().length}
          </p>
          <p className="text-xs text-gray-500">Not enrolled</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Classes</p>
          <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
          <p className="text-xs text-gray-500">Available classes</p>
        </div>
      </div>

      {/* Class Assignments Table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <ClassAssignmentTable
          assignments={assignments}
          students={students}
          classes={classes}
          academicYears={academicYears}
          terms={terms}
          onEdit={handleEditAssignment}
          onDelete={handleDeleteAssignment}
          onPromote={handlePromoteStudent}
          emptyMessage={
            filters.class_id || filters.academic_year_id || filters.search
              ? "No assignments match your filters. Try changing your search criteria."
              : "No class assignments found. Click 'Enroll Student' to add students to classes."
          }
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                pagination.hasPrevPage
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                pagination.hasNextPage
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                enrollments
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    !pagination.hasPrevPage
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                {/* Page numbers */}
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pagination.page === pageNum
                            ? "z-10 bg-emerald-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                            : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    !pagination.hasNextPage
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingAssignment ? "Edit Enrollment" : "Enroll Student in Class"
        }
        size="large"
      >
        <ClassAssignmentForm
          assignment={editingAssignment}
          students={getAvailableStudents()}
          classes={classes}
          academicYears={academicYears}
          onSave={handleSaveAssignment}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Enroll Students"
        size="xl"
      >
        <BulkClassAssignmentForm
          students={getAvailableStudents()}
          classes={classes}
          academicYears={academicYears}
          onSave={handleBulkEnrollment}
          onCancel={() => setIsBulkModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ClassAssignments;
