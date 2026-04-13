import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import debounce from "lodash/debounce";
import { useAcademicData } from "../../hooks/useAcademicContext";
import api from "../../components/axiosconfig/axiosConfig";

const ReportCardsList = () => {
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

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
  } = useAcademicData();

  // Filters and pagination state
  const [filters, setFilters] = useState({
    class_id: "",
    search: "",
    status: "all",
  });

  // Server-side pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Bulk selection state
  const [selectedReportCards, setSelectedReportCards] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: "student_name",
    direction: "asc",
  });
  const [expandedRow, setExpandedRow] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  // Sync filters when academic year or term changes
  useEffect(() => {
    if (selectedAcademicYear || selectedTerm) {
      // Reset to page 1 when academic filters change
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      // Fetch report cards with new academic filters
      const timer = setTimeout(() => {
        fetchReportCards(1);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [selectedAcademicYear, selectedTerm]);

  // Fetch report cards with current filters and pagination
  const fetchReportCards = useCallback(
    async (page = 1) => {
      if (!selectedAcademicYear || !selectedTerm) {
        setReportCards([]);
        setPagination((prev) => ({ ...prev, totalItems: 0 }));
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.itemsPerPage.toString(),
          sort_by: sortConfig.key,
          sort_order: sortConfig.direction,
          academic_year_id: selectedAcademicYear,
          term_id: selectedTerm,
          ...filters,
        });

        // Remove empty filters
        Object.keys(filters).forEach((key) => {
          if (!filters[key]) {
            params.delete(key);
          }
        });

        const response = await api(
          `/getreportcards?${params}`,
        );

        setReportCards(response.data.reportCards || []);
        setPagination((prev) => ({
          ...prev,
          currentPage: response.data.pagination?.page || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.total || 0,
          hasNextPage: response.data.pagination?.hasNextPage || false,
          hasPrevPage: response.data.pagination?.hasPrevPage || false,
        }));

        // Reset selection when data changes
        setSelectedReportCards([]);
        setIsSelectAll(false);
      } catch (error) {
        console.error("Error fetching report cards:", error);
        setReportCards([]);
      }
      setLoading(false);
    },
    [
      filters,
      sortConfig,
      pagination.itemsPerPage,
      selectedAcademicYear,
      selectedTerm,
    ],
  );

  // Initial data fetch (only classes now)
  const fetchClasses = async () => {
    try {
      const classesRes = await api.get(
        "/getclasses",
      );
      setClasses(classesRes.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Fetch when filters change (except academic year/term which are handled separately)
  useEffect(() => {
    if (selectedAcademicYear && selectedTerm) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));

      const timer = setTimeout(
        () => {
          fetchReportCards(1);
        },
        filters.search ? 500 : 0,
      );

      return () => clearTimeout(timer);
    }
  }, [filters, sortConfig]);

  // Handle individual report card download
  const handleDownloadIndividual = async (reportCardId, studentName) => {
    try {
      const response = await api.get(
        `/getindividualreportcardpdf/${reportCardId}`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `report-card-${studentName.replace(/\s+/g, "-")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading individual report card:", error);
      alert("Failed to download report card: " + error.message);
    }
  };

  // Handle bulk download
  const handleBulkDownload = async () => {
    if (selectedReportCards.length === 0) {
      alert("Please select at least one report card to download");
      return;
    }

    setDownloading(true);
    try {
      // Create individual downloads or combine into ZIP
      for (const cardId of selectedReportCards) {
        const reportCard = reportCards.find((card) => card.id === cardId);
        if (reportCard) {
          await handleDownloadIndividual(
            cardId,
            `${reportCard.first_name}-${reportCard.last_name}`,
          );
        }
      }

      // If you want to combine into single PDF, you'd need backend support
      alert(`Downloaded ${selectedReportCards.length} report card(s)`);
    } catch (error) {
      console.error("Error in bulk download:", error);
      alert("Some downloads failed: " + error.message);
    }
    setDownloading(false);
  };

  // Handle select all on current page
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = reportCards.map((card) => card.id);
      setSelectedReportCards(allIds);
      setIsSelectAll(true);
    } else {
      setSelectedReportCards([]);
      setIsSelectAll(false);
    }
  };

  // Handle individual selection
  const handleSelectReportCard = (reportCardId, checked) => {
    if (checked) {
      setSelectedReportCards((prev) => [...prev, reportCardId]);
    } else {
      setSelectedReportCards((prev) =>
        prev.filter((id) => id !== reportCardId),
      );
      setIsSelectAll(false);
    }
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      fetchReportCards(page);
    }
  };

  // Download all report cards for current class/year/term
  const handleDownloadAllReportCards = async () => {
    if (!filters.class_id || !selectedAcademicYear || !selectedTerm) {
      alert("Please select class, academic year, and term first");
      return;
    }

    try {
      const response = await api.get(
        `/generateclassreportcardspdf/${filters.class_id}/${selectedAcademicYear}/${selectedTerm}`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const selectedClass = classes.find((c) => c.id == filters.class_id);
      const className = selectedClass
        ? selectedClass.class_name.replace(/\s+/g, "-")
        : filters.class_id;
      link.setAttribute("download", `all-report-cards-${className}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading all report cards:", error);
      alert(
        "Error downloading all report cards: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const handleViewReportCard = (reportCard) => {
    navigate(`/academics/report-cards/view/${reportCard.id}`);
  };

  const getGradeColor = (total) => {
    if (total >= 80) return "bg-green-100 text-green-800";
    if (total >= 70) return "bg-blue-100 text-blue-800";
    if (total >= 60) return "bg-yellow-100 text-yellow-800";
    if (total >= 50) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronDownIcon className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  // Show loading for academic data
  if (academicLoading) {
    return <LoadingSpinner text="Loading academic data..." />;
  }

  if (academicError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-red-800 mb-2">
            Error Loading Academic Data
          </h2>
          <p className="text-red-700">{academicError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      {/* Header with Academic Info */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              Report Cards
            </h1>
            <p className="text-gray-600">
              Manage and download student report cards
            </p>
          </div>

          {/* Selected Academic Info */}
          {selectedAcademicYear && selectedTerm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {
                      academicYears.find((y) => y.id == selectedAcademicYear)
                        ?.year_label
                    }
                  </p>
                  <p className="text-xs text-blue-700">
                    Term: {terms.find((t) => t.id == selectedTerm)?.term_name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">
              Showing {reportCards.length} of {pagination.totalItems} report
              cards
              {selectedReportCards.length > 0 &&
                ` (${selectedReportCards.length} selected)`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bulk Download Button */}
            {selectedReportCards.length > 0 && (
              <button
                onClick={handleBulkDownload}
                disabled={downloading}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>
                  {downloading
                    ? "Downloading..."
                    : `Download ${selectedReportCards.length} Selected`}
                </span>
              </button>
            )}

            {/* Download All Button */}
            <button
              onClick={handleDownloadAllReportCards}
              disabled={
                !filters.class_id || !selectedAcademicYear || !selectedTerm
              }
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              <span>Download All as PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {reportCards.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={isSelectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Select all {reportCards.length} report cards on this page
              </label>
            </div>

            {selectedReportCards.length > 0 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {selectedReportCards.length}
                </span>{" "}
                report cards selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Academic and Class Filters */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

        {/* Academic Year and Term Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Academic Year
              </span>
            </label>
            <select
              value={selectedAcademicYear || ""}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) => handleTermChange(e.target.value)}
              disabled={!selectedAcademicYear}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, class_id: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Performance
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Performances</option>
              <option value="excellent">Excellent (≥80%)</option>
              <option value="good">Good (60-79%)</option>
              <option value="needs_improvement">
                Needs Improvement (&lt;60%)
              </option>
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students by name, admission number..."
            defaultValue={filters.search}
            onChange={(e) =>
              debounce((value) => {
                setFilters((prev) => ({ ...prev, search: value }));
              }, 500)(e.target.value)
            }
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Academic Year/Term Info */}
        {selectedAcademicYear && selectedTerm && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-medium">
                    Selected Academic Context:
                  </span>
                  <span className="ml-2 text-gray-700">
                    {
                      academicYears.find((y) => y.id == selectedAcademicYear)
                        ?.year_label
                    }
                    {" • "}
                    {terms.find((t) => t.id == selectedTerm)?.term_name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => fetchReportCards(1)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Academic Context Warning */}
      {(!selectedAcademicYear || !selectedTerm) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Select Academic Year and Term
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please select an academic year and term to view report cards.
                </p>
                {!selectedAcademicYear && (
                  <p className="mt-1">• Start by selecting an Academic Year</p>
                )}
                {selectedAcademicYear && !selectedTerm && (
                  <p className="mt-1">• Now select a Term</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {selectedAcademicYear && selectedTerm ? (
        <div className="bg-white shadow rounded-lg border overflow-hidden">
          {loading && reportCards.length > 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <span className="sr-only">Select</span>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("student_name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Student</span>
                      <SortIcon column="student_name" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("class")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Class</span>
                      <SortIcon column="class" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Score</span>
                      <SortIcon column="score" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("position")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Position</span>
                      <SortIcon column="position" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Issued Date</span>
                      <SortIcon column="date" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportCards.map((reportCard) => (
                  <React.Fragment key={reportCard.id}>
                    <tr
                      className={`hover:bg-gray-50 ${
                        expandedRow === reportCard.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === reportCard.id ? null : reportCard.id,
                        )
                      }
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedReportCards.includes(reportCard.id)}
                          onChange={(e) =>
                            handleSelectReportCard(
                              reportCard.id,
                              e.target.checked,
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reportCard.first_name} {reportCard.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reportCard.admission_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reportCard.class_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reportCard.academic_year} - {reportCard.term_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                            reportCard.overall_total,
                          )}`}
                        >
                          {reportCard.overall_total || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reportCard.overall_position ? (
                          <span className="font-semibold">
                            {getOrdinalSuffix(reportCard.overall_position)}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(reportCard.date_issued).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReportCard(reportCard);
                            }}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100"
                            title="View Report"
                          >
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadIndividual(
                                reportCard.id,
                                `${reportCard.first_name}-${reportCard.last_name}`,
                              );
                            }}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded hover:bg-green-100"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === reportCard.id && (
                      <tr className="bg-blue-50">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Quick Preview
                              </h4>
                              {reportCard.teacher_comment && (
                                <p className="text-gray-600">
                                  <span className="font-medium">
                                    Teacher's Comment:
                                  </span>
                                  {reportCard.teacher_comment.length > 150
                                    ? `${reportCard.teacher_comment.substring(
                                        0,
                                        150,
                                      )}...`
                                    : reportCard.teacher_comment}
                                </p>
                              )}
                            </div>
                            <div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadIndividual(
                                      reportCard.id,
                                      `${reportCard.first_name}-${reportCard.last_name}`,
                                    );
                                  }}
                                  className="inline-flex items-center space-x-1 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                  <ArrowDownTrayIcon className="w-4 h-4" />
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewReportCard(reportCard);
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  View Full Report
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage +
                        1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.currentPage * pagination.itemsPerPage,
                        pagination.totalItems,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.totalItems}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>

                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.currentPage >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.currentPage === pageNum
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}

                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {reportCards.length === 0 && !loading && (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Report Cards Found
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.class_id || filters.search
                  ? "No report cards match your filters for the selected academic year and term."
                  : "No report cards have been generated for the selected academic year and term."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* No Academic Context Selected State */
        <div className="bg-white shadow rounded-lg border overflow-hidden">
          <div className="text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Academic Context
            </h3>
            <p className="text-gray-500 mb-4">
              Please select an academic year and term above to view report
              cards.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const getOrdinalSuffix = (position) => {
  if (!position) return "N/A";
  if (position === 1) return "1st";
  if (position === 2) return "2nd";
  if (position === 3) return "3rd";
  return `${position}th`;
};

export default ReportCardsList;
