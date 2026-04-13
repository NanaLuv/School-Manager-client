import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AcademicYearForm from "../../components/academics/AcademicYearForm";
import TermForm from "../../components/academics/TermForm";
import AcademicYearTable from "../../components/academics/AcademicYearTable";
import TermTable from "../../components/academics/TermTable";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const YearTermSettings = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    sort_by: "start_date",
    sort_order: "desc",
  });

  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("years");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [editingTerm, setEditingTerm] = useState(null);
  const [modalType, setModalType] = useState("year");

  // Status options for filter
  const statusOptions = [
    { value: "all", label: "All Years" },
    { value: "current", label: "Current Year" },
    { value: "active", label: "Active Years" },
    { value: "past", label: "Past Years" },
    { value: "upcoming", label: "Upcoming Years" },
  ];

  // Sort options
  const sortOptions = [
    { value: "start_date", label: "Start Date" },
    { value: "end_date", label: "End Date" },
    { value: "year_label", label: "Year Label" },
  ];

  const getAcademicYearsData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await api.get(
        "/getacademicyearspaginated",
        {
          params,
        }
      );

      setAcademicYears(response.data.years);
      setPagination(response.data.pagination);

      // For backward compatibility, also fetch terms
      const termsRes = await api.get("/getterms");
      setTerms(termsRes.data);
    } catch (error) {
      console.error("Error fetching academic data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getAcademicYearsData();
  }, [pagination.page, filters]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Trigger refetch with new search term
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      sort_by: "start_date",
      sort_order: "desc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Academic Year Handlers
  const handleAddYear = () => {
    setModalType("year");
    setEditingYear(null);
    setIsModalOpen(true);
  };

  const handleEditYear = (year) => {
    setModalType("year");
    setEditingYear(year);
    setIsModalOpen(true);
  };

  const handleDeleteYear = async (yearId) => {
    if (window.confirm("Are you sure you want to delete this academic year?")) {
      try {
        await api.delete(
          `/deleteacademicyear/${yearId}`
        );
        getAcademicYearsData(); // Refresh data
      } catch (error) {
        console.error("Error deleting academic year:", error);
      }
    }
  };

  const handleSetCurrentYear = async (yearId) => {
    try {
      await api.put(`/setcurrentyear/${yearId}`);
      getAcademicYearsData(); // Refresh data
    } catch (error) {
      console.error("Error setting current year:", error);
    }
  };

  // Term Handlers (you'll need to update these too)
  const handleAddTerm = () => {
    setModalType("term");
    setEditingTerm(null);
    setIsModalOpen(true);
  };

  const handleEditTerm = (term) => {
    setModalType("term");
    setEditingTerm(term);
    setIsModalOpen(true);
  };

  const handleDeleteTerm = async (termId) => {
    if (window.confirm("Are you sure you want to delete this term?")) {
      try {
        await api.delete(`/deleteterm/${termId}`);
        // You might want to fetch terms separately here
      } catch (error) {
        console.error("Error deleting term:", error);
      }
    }
  };

  const handleSave = async (data) => {
    try {
      if (modalType === "year") {
        if (editingYear) {
          await api.put(
            `/updateacademicyear/${editingYear.id}`,
            data
          );
        } else {
          await api.post(
            "/createacademicyear",
            data
          );
        }
      } else {
        if (editingTerm) {
          await api.put(
            `/updateterm/${editingTerm.id}`,
            data
          );
        } else {
          await api.post("/createterm", data);
        }
      }
      setIsModalOpen(false);
      getAcademicYearsData(); // Refresh data
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  if (loading && pagination.page === 1) {
    return <LoadingSpinner text="Loading academic settings..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Academic Settings
          </h1>
          <p className="text-gray-600">Manage academic years and terms</p>
        </div>
        <button
          onClick={activeTab === "years" ? handleAddYear : handleAddTerm}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add {activeTab === "years" ? "Academic Year" : "Term"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("years")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "years"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Academic Years
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {pagination.total}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "terms"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Terms
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                {terms.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Filters for Academic Years tab */}
      {activeTab === "years" && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search academic years..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </form>

            {/* Status filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort options */}
            <div className="flex items-center space-x-2">
              <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange("sort_by", e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.sort_order}
                onChange={(e) =>
                  handleFilterChange("sort_order", e.target.value)
                }
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {/* Clear filters button */}
            {(filters.search || filters.status !== "all") && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "years" ? (
        <>
          <div className="bg-white rounded-lg shadow mb-6">
            <AcademicYearTable
              academicYears={academicYears}
              onEdit={handleEditYear}
              onDelete={handleDeleteYear}
              onSetCurrent={handleSetCurrentYear}
              emptyMessage="No academic years found. Click 'Add Academic Year' to create the first one."
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
                    <span className="font-medium">{academicYears.length}</span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    academic years
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
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
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
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
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
                      }
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
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <TermTable
            terms={terms}
            academicYears={academicYears}
            onEdit={handleEditTerm}
            onDelete={handleDeleteTerm}
            emptyMessage="No terms found. Click 'Add Term' to create the first one."
          />
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === "year"
            ? editingYear
              ? "Edit Academic Year"
              : "Add New Academic Year"
            : editingTerm
            ? "Edit Term"
            : "Add New Term"
        }
        size="medium"
      >
        {modalType === "year" ? (
          <AcademicYearForm
            year={editingYear}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        ) : (
          <TermForm
            term={editingTerm}
            academicYears={academicYears}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default YearTermSettings;
