import React, { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ClassForm from "../../components/classes/ClassForm";
import ClassTable from "../../components/classes/ClassTable";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import debounce from "lodash/debounce";
import api from "../../components/axiosconfig/axiosConfig";

const ClassesList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const { user } = useAuth();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClasses, setTotalClasses] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("class_name");
  const [sortOrder, setSortOrder] = useState("asc");

  const pageSize = 10;

  // Fetch classes with all filters
  const getClasses = useCallback(
    async (page = 1, filters = {}) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pageSize,
          search: filters.search || searchTerm,
          status: filters.status || filterStatus,
          sort_by: filters.sort_by || sortBy,
          sort_order: filters.sort_order || sortOrder,
        };


        const response = await api.get(
          `/getclasses`,
          { params }
        );


        // Handle the paginated response
        if (response.data.pagination) {
          setClasses(response.data.classes);
          setTotalPages(response.data.pagination.totalPages);
          setTotalClasses(response.data.pagination.total);
        } else {
          // Fallback for non-paginated response
          setClasses(Array.isArray(response.data) ? response.data : []);
          const dataArray = Array.isArray(response.data) ? response.data : [];
          setTotalPages(Math.ceil(dataArray.length / pageSize));
          setTotalClasses(dataArray.length);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        setClasses([]);
        setTotalPages(1);
        setTotalClasses(0);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, filterStatus, sortBy, sortOrder]
  );

  // Initial load
  useEffect(() => {
    getClasses(currentPage);
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      setCurrentPage(1);
      getClasses(1, { search: searchValue });
    }, 500),
    [getClasses]
  );

  useEffect(() => {
    if (searchTerm !== "") {
      debouncedSearch(searchTerm);
    } else {
      debouncedSearch("");
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);

    switch (filterType) {
      case "status":
        setFilterStatus(value);
        getClasses(1, { status: value });
        break;
      case "sort":
        setSortBy(value);
        getClasses(1, { sort_by: value });
        break;
      case "order":
        setSortOrder(value);
        getClasses(1, { sort_order: value });
        break;
      default:
        break;
    }
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await api.delete(
          `/deleteclass/${classId}`
        );
        // Refresh current page
        getClasses(currentPage);
      } catch (error) {
        console.error("Error deleting class:", error);
        alert("Failed to delete class. Please try again.");
      }
    }
  };

  const handleSaveClass = async (classData) => {
    try {
      if (editingClass) {
        await api.put(
          `/updateclass/${editingClass.id}`,
          classData
        );
      } else {
        await api.post("/createclass", classData);
      }
      setIsModalOpen(false);
      // Refresh current page
      getClasses(currentPage);
    } catch (error) {
      console.error("Error saving class:", error);
      alert("Failed to save class. Please try again.");
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      getClasses(page);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 7;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
      if (currentPage <= 4) {
        // Near beginning
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // In middle
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Calculate capacity statistics
  const calculateCapacityStats = () => {
    if (classes.length === 0) return { full: 0, nearlyFull: 0, available: 0 };

    const full = classes.filter((c) => c.capacity_status === "error").length;
    const nearlyFull = classes.filter(
      (c) => c.capacity_status === "warning"
    ).length;
    const available = classes.filter(
      (c) => c.capacity_status === "success"
    ).length;

    return { full, nearlyFull, available };
  };

  const capacityStats = calculateCapacityStats();

  if (loading && classes.length === 0) {
    return <LoadingSpinner text="Loading classes..." />;
  }

  return (
    <div className="p-6 bg-white">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Class Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage all classes, track capacity, and organize room assignments
          </p>
        </div>
        {user.role_name.toLowerCase() === "admin" && (
          <button
            onClick={handleAddClass}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-medium">Add New Class</span>
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes by name or room number..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="nearly_full">Nearly Full</option>
                <option value="full">Full</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <AdjustmentsHorizontalIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                value={sortBy}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer"
              >
                <option value="class_name">Sort by Name</option>
                <option value="capacity">Sort by Capacity</option>
                <option value="current_student_count">Sort by Students</option>
                <option value="room_number">Sort by Room</option>
              </select>
            </div>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => handleFilterChange("order", e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <span>
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * pageSize, totalClasses)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {totalClasses}
              </span>{" "}
              classes
            </span>
          </div>
          <div className="text-gray-500">
            Page <span className="font-semibold">{currentPage}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-4 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Total Classes</p>
          <p className="text-3xl font-bold text-emerald-900 mt-2">
            {totalClasses}
          </p>
          <div className="flex items-center mt-2">
            <div className="w-full bg-emerald-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-blue-700">Total Capacity</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">
            {classes
              .reduce((sum, cls) => sum + (cls.capacity || 0), 0)
              .toLocaleString()}
          </p>
          <div className="text-sm text-blue-600 mt-2">
            Average:{" "}
            {classes.length > 0
              ? Math.round(
                  classes.reduce((sum, cls) => sum + (cls.capacity || 0), 0) /
                    classes.length
                )
              : 0}{" "}
            per class
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Current Enrollment
          </p>
          <p className="text-3xl font-bold text-amber-900 mt-2">
            {classes.reduce(
              (sum, cls) => sum + (cls.current_student_count || 0),
              0
            )}
          </p>
          <div className="flex items-center text-sm text-amber-600 mt-2">
            <span className="bg-amber-100 px-2 py-1 rounded-full">
              {capacityStats.available} available
            </span>
            <span className="mx-2">•</span>
            <span className="bg-orange-100 px-2 py-1 rounded-full">
              {capacityStats.nearlyFull} nearly full
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 p-4 rounded-xl shadow-sm">
          <p className="text-sm font-medium text-rose-700">Class Status</p>
          <div className="flex justify-between items-center mt-2">
            <div>
              <p className="text-lg font-bold text-rose-900">
                {capacityStats.full}
              </p>
              <p className="text-sm text-rose-600">Full classes</p>
            </div>
            <div className="text-3xl font-bold text-rose-900">
              {totalPages > 1 ? `${currentPage}/${totalPages}` : "1/1"}
            </div>
          </div>
          <div className="text-xs text-rose-500 mt-2">
            {classes.length} classes on this page
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner text="Loading classes..." />
          </div>
        ) : (
          <>
            <ClassTable
              classes={classes}
              onEdit={handleEditClass}
              onDelete={handleDeleteClass}
              emptyMessage={
                searchTerm || filterStatus !== "all"
                  ? "No classes match your search criteria. Try adjusting your filters."
                  : "No classes found. Click 'Add New Class' to create the first one."
              }
            />

            {/* Enhanced Pagination Controls */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 bg-white px-4 py-6 sm:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Mobile pagination */}
                  <div className="flex items-center justify-between w-full sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                      }`}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <div className="text-sm text-gray-600 font-medium">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Desktop pagination */}
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-semibold">
                          {(currentPage - 1) * pageSize + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold">
                          {Math.min(currentPage * pageSize, totalClasses)}
                        </span>{" "}
                        of <span className="font-semibold">{totalClasses}</span>{" "}
                        classes
                      </p>
                    </div>

                    <div>
                      <nav
                        className="flex items-center space-x-2"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            currentPage === 1
                              ? "text-gray-400 cursor-not-allowed bg-gray-100"
                              : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300"
                          }`}
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                          <span className="ml-1">Previous</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          {getPageNumbers().map((pageNum, index) => (
                            <button
                              key={index}
                              onClick={() =>
                                pageNum !== "..." && handlePageChange(pageNum)
                              }
                              className={`relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                pageNum === currentPage
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : pageNum === "..."
                                  ? "text-gray-400 cursor-default"
                                  : "text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-300"
                              }`}
                              disabled={pageNum === "..."}
                              aria-current={
                                pageNum === currentPage ? "page" : undefined
                              }
                            >
                              {pageNum === "..." ? (
                                <EllipsisHorizontalIcon className="w-5 h-5" />
                              ) : (
                                pageNum
                              )}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            currentPage === totalPages
                              ? "text-gray-400 cursor-not-allowed bg-gray-100"
                              : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300"
                          }`}
                        >
                          <span className="mr-1">Next</span>
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>

                {/* Page size selector (optional) */}
                <div className="mt-4 flex justify-center sm:justify-end">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Classes per page:</span>
                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      value={pageSize}
                      onChange={(e) => {
                        // Note: You would need to adjust backend to support dynamic pageSize
                      }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Empty State */}
      {!loading && classes.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No classes found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter to find what you're looking for."
              : "Get started by creating your first class. This will help you organize students and manage schedules."}
          </p>
          {user.role_name.toLowerCase() === "admin" &&
            !searchTerm &&
            filterStatus === "all" && (
              <button
                onClick={handleAddClass}
                className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Create Your First Class</span>
              </button>
            )}
        </div>
      )}

      {/* Add/Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? "Edit Class" : "Add New Class"}
        size="medium"
      >
        <ClassForm
          classItem={editingClass}
          onSave={handleSaveClass}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ClassesList;
