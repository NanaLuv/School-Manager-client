import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PlusIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import StudentSkeleton from "../../components/common/StudentSkeleton"; // NEW
import StudentForm from "../../components/students/StudentForm";
import StudentTable from "../../components/students/StudentTable";
import ImportStudentsModal from "../../components/students/ImportStudentsModal";
import StudentDetailsModal from "../../components/students/StudentDetailsModal";
import useDebounce from "../../hooks/useDebounce"; // NEW
import api from "../../components/axiosconfig/axiosConfig";

const StudentsList = () => {
  // State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const [showAllStudents, setShowAllStudents] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [notification, setNotification] = useState(null);
  const [success, setSuccess] = useState(false);

  // NEW: Debounced search
  const debouncedSearch = useDebounce(searchTerm, 500);

  // NEW: Cache
  const cacheRef = useRef({});
  const [cacheVersion, setCacheVersion] = useState(0);

  // NEW: Function to clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    setCacheVersion((prev) => prev + 1);
  }, []);

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const response = await api.get("/getclasses");
        setClasses(response.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
      setLoadingClasses(false);
    };

    fetchClasses();
  }, []);

  // NEW: Read URL parameters on load
  const readURLParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    return {
      page: parseInt(params.get("page")) || 1,
      search: params.get("search") || "",
      status: params.get("status") || "all",
      limit: parseInt(params.get("limit")) || 20,
      includeInactive: params.get("inactive") === "true",
    };
  }, []);

  // NEW: Update URL when state changes
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage);
    if (searchTerm) params.set("search", searchTerm);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (itemsPerPage !== 20) params.set("limit", itemsPerPage);
    if (showAllStudents) params.set("inactive", "true");

    const newUrl = `${window.location.pathname}${
      params.toString() ? "?" + params.toString() : ""
    }`;
    window.history.replaceState({}, "", newUrl);
  }, [currentPage, searchTerm, filterStatus, itemsPerPage, showAllStudents]);

  // Initialize from URL on component mount
  useEffect(() => {
    const { page, search, status, limit, includeInactive } = readURLParams();

    setCurrentPage(page);
    setSearchTerm(search);
    setFilterStatus(status);
    setItemsPerPage(limit);
    setShowAllStudents(includeInactive);
  }, [readURLParams]);

  // Fetch students with pagination and cache
  const getStudents = async (page = 1) => {
    setLoading(true);
    try {
      // Create cache key
      const cacheKey = `${page}-${debouncedSearch}-${filterStatus}-${showAllStudents}-${itemsPerPage}-${cacheVersion}`;

      // Check cache first
      if (cacheRef.current[cacheKey]) {
        const cachedData = cacheRef.current[cacheKey];
        setStudents(cachedData.students);
        setTotalItems(cachedData.pagination.total);
        setTotalPages(cachedData.pagination.totalPages);
        setHasNextPage(cachedData.pagination.hasNextPage);
        setHasPrevPage(cachedData.pagination.hasPrevPage);
        setCurrentPage(cachedData.pagination.page);
        setLoading(false);
        return;
      }

      const params = {
        page,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        includeInactive: showAllStudents ? "true" : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      };

      // Remove undefined params
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key],
      );

      const response = await api.get("/getstudents", { params });

      // Store in cache
      cacheRef.current[cacheKey] = response.data;

      setStudents(response.data.students);
      setTotalItems(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
      setHasNextPage(response.data.pagination.hasNextPage);
      setHasPrevPage(response.data.pagination.hasPrevPage);
      setCurrentPage(response.data.pagination.page);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
    setLoading(false);
  };

  // Fetch data when dependencies change
  useEffect(() => {
    getStudents(currentPage);
  }, [
    currentPage,
    debouncedSearch,
    filterStatus,
    showAllStudents,
    itemsPerPage,
    cacheVersion,
  ]);

  // Update URL when state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Clear cache when filters change (except page)
  useEffect(() => {
    clearCache();
  }, [
    debouncedSearch,
    filterStatus,
    showAllStudents,
    itemsPerPage,
    clearCache,
  ]);

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  // Student actions
  const handleAddStudent = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleViewStudent = (student) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDeactivateStudent = async (studentId) => {
    if (
      window.confirm(
        "Are you sure you want to deactivate this student? They will no longer appear in active lists but their data will be preserved.",
      )
    ) {
      try {
        await api.put(`/deactivatestudent/${studentId}`);
        getStudents(currentPage); // Refresh current page
      } catch (error) {
        console.error("Error deactivating student:", error);
      }
    }
  };

  const handleActivateStudent = async (studentId) => {
    if (
      window.confirm(
        "Are you sure you want to activate this student? They will be added back to active lists.",
      )
    ) {
      try {
        const response = await api.put(`/activatestudent/${studentId}`);
        setNotification(response.data);
        setSuccess(true);
        alert(response.data.message);
        getStudents(currentPage); // Refresh current page
      } catch (error) {
        console.error("Error activating student:", error);
        setSuccess(false);
        setNotification(null);
      }
    }
  };

  const handleSaveStudent = async (studentData) => {
    try {
      if (editingStudent) {
        const response = await api.put(`/updatestudent/${editingStudent.id}`, studentData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("Update response:", response.data);
        alert(response.data.message || "Student updated successfully!");
      } else {
        await api.post("/createstudent", studentData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }
      setIsModalOpen(false);
      getStudents(currentPage); // Refresh current page
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleExportStudents = async (exportType = "all") => {
    try {
      let url = "/exportstudents";

      if (exportType === "active") {
        url += "?activeOnly=true";
      } else if (exportType === "inactive") {
        url += "?inactiveOnly=true";
      }

      const response = await api.get(url, {
        responseType: "blob",
      });

      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = urlBlob;

      const contentDisposition = response.headers["content-disposition"];
      let fileName = "";

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      if (!fileName) {
        switch (exportType) {
          case "active":
            fileName = `active_students_export_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;
            break;
          case "inactive":
            fileName = `inactive_students_export_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;
            break;
          default:
            fileName = `all_students_export_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("Error exporting students:", error);
      alert("Error exporting students. Please try again.");
    }
  };

  const handleImportComplete = () => {
    setIsImportModalOpen(false);
    getStudents(currentPage);
  };

  // Calculate counts (for stats cards)
  const activeStudentsCount = students.filter(
    (student) => student.is_active !== false && student.is_active !== 0,
  ).length;

  const inactiveStudentsCount = students.filter(
    (student) => student.is_active === false || student.is_active === 0,
  ).length;

  const feeBlockCount = students.filter(
    (student) => student.has_fee_block === true || student.has_fee_block === 1,
  ).length;

  // Handle search change with cache clearing
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle status change with cache clearing
  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  // Handle toggle with cache clearing
  const handleToggleChange = () => {
    setShowAllStudents(!showAllStudents);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Student Management
          </h1>
          <p className="text-gray-600">Manage all students in the school</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex space-x-2">
            <button
              onClick={() => handleExportStudents("all")}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>Export All</span>
            </button>
            <button
              onClick={() => handleExportStudents("active")}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>Export Active</span>
            </button>
            <button
              onClick={() => handleExportStudents("inactive")}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>Export Inactive</span>
            </button>
          </div>
          <button
            onClick={handleImportClick}
            className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            <DocumentArrowUpIcon className="w-5 h-5" />
            <span>Import</span>
          </button>
          <button
            onClick={handleAddStudent}
            className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Active Students</p>
          <p className="text-2xl font-bold text-green-600">
            {activeStudentsCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Inactive Students</p>
          <p className="text-2xl font-bold text-orange-600">
            {inactiveStudentsCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Fee Block</p>
          <p className="text-2xl font-bold text-red-600">{feeBlockCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">View Mode</p>
              <p className="text-lg font-bold text-purple-600">
                {showAllStudents ? "All Students" : "Active Only"}
              </p>
            </div>
            <button
              onClick={handleToggleChange}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showAllStudents ? "bg-purple-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showAllStudents ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <input
              type="text"
              placeholder="Search by name, admission number, or parent..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Students</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="fee_block">Fee Block Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-gray-600">
              Showing {students.length} of {totalItems} students
            </p>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow mb-4">
        {loading ? (
          <StudentSkeleton rows={itemsPerPage} />
        ) : (
          <StudentTable
            students={students}
            onEdit={handleEditStudent}
            onDeactivate={handleDeactivateStudent}
            onActivate={handleActivateStudent}
            onView={handleViewStudent}
            emptyMessage="No students found."
          />
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={!hasPrevPage}
              className={`px-3 py-1 rounded border ${
                !hasPrevPage
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              First
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              className={`px-3 py-1 rounded border ${
                !hasPrevPage
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded border ${
                  currentPage === pageNum
                    ? "bg-emerald-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className={`px-3 py-1 rounded border ${
                !hasNextPage
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={!hasNextPage}
              className={`px-3 py-1 rounded border ${
                !hasNextPage
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Last
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {totalItems} total students
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "Edit Student" : "Add New Student"}
        size="large"
      >
        <StudentForm
          student={editingStudent}
          classes={classes}
          loadingClasses={loadingClasses}
          onSave={handleSaveStudent}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <StudentDetailsModal
        student={viewingStudent}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </div>
  );
};

export default StudentsList;
