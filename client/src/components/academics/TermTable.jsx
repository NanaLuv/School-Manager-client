
import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import api from "../axiosconfig/axiosConfig";

const TermTable = ({
  terms,
  academicYears,
  onEdit,
  onDelete,
  emptyMessage,
}) => {
  const [selectedYearId, setSelectedYearId] = useState("");
  const [filteredTerms, setFilteredTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Find current academic year
  const currentYear =
    academicYears?.find((year) => year.is_current) || academicYears?.[0];

  // Initialize with current year
  useEffect(() => {
    if (currentYear) {
      setSelectedYearId(currentYear.id.toString());
    }
  }, [currentYear]);

  // Fetch terms when academic year is selected
  useEffect(() => {
    if (selectedYearId) {
      fetchTermsByAcademicYear(selectedYearId);
    } else {
      // Show the terms passed as props (current year terms)
      setFilteredTerms(terms || []);
    }
  }, [selectedYearId, terms]);

  const fetchTermsByAcademicYear = async (academicYearId) => {
    setIsLoading(true);
    try {
      const response = await api.get(
        "/terms/by-academic-year",
        {
          params: { academic_year_id: academicYearId },
        }
      );
      setFilteredTerms(response.data);
    } catch (error) {
      console.error("Error fetching terms:", error);
      // Fallback to showing terms from props
      setFilteredTerms(terms || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (e) => {
    const yearId = e.target.value;
    setSelectedYearId(yearId);
  };

  // Get the selected year label for display
  const getSelectedYearLabel = () => {
    if (!selectedYearId) return "Select Year";
    const year = academicYears?.find((y) => y.id.toString() === selectedYearId);
    return year ? year.year_label : "Unknown Year";
  };

  // Get the status of a term
  const getTermStatus = (term) => {
    const today = new Date();
    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);

    if (today < startDate)
      return { text: "Upcoming", color: "bg-blue-100 text-blue-800" };
    if (today > endDate)
      return { text: "Completed", color: "bg-gray-100 text-gray-800" };
    return { text: "Active", color: "bg-green-100 text-green-800" };
  };

  // Calculate term progress
  const getTermProgress = (term) => {
    const today = new Date();
    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);

    if (today < startDate) return 0;
    if (today > endDate) return 100;

    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const displayTerms = filteredTerms.length > 0 ? filteredTerms : terms || [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="mt-2 text-gray-500">Loading terms...</p>
      </div>
    );
  }

  if (!displayTerms || displayTerms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Year Filter Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              Show terms for:
            </span>

            <div className="relative">
              <select
                value={selectedYearId}
                onChange={handleYearChange}
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Years</option>
                {academicYears?.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year_label} {year.is_current && " (Current)"}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <span className="text-sm text-gray-600">
              Showing {displayTerms.length} term
              {displayTerms.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-gray-600">Active</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span className="text-gray-600">Upcoming</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
              <span className="text-gray-600">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Term
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayTerms.map((term) => {
              const status = getTermStatus(term);
              const progress = getTermProgress(term);
              const yearLabel =
                academicYears?.find((y) => y.id === term.academic_year_id)
                  ?.year_label || "Unknown";

              return (
                <tr key={term.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {term.term_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{yearLabel}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(term.start_date)} -{" "}
                      {formatDate(term.end_date)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.ceil(
                        (new Date(term.end_date) - new Date(term.start_date)) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                    >
                      {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(term)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Edit Term"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(term.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Term"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TermTable;