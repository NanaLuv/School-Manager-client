import React from "react";
import { PencilIcon, TrashIcon, StarIcon } from "@heroicons/react/24/outline";

const AcademicYearTable = ({
  academicYears,
  onEdit,
  onDelete,
  onSetCurrent,
  emptyMessage,
}) => {
  if (!academicYears || academicYears.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatus = (year) => {
    const today = new Date();
    const startDate = new Date(year.start_date);
    const endDate = new Date(year.end_date);

    if (year.is_current)
      return { text: "Current", color: "bg-green-100 text-green-800" };
    if (today < startDate)
      return { text: "Upcoming", color: "bg-blue-100 text-blue-800" };
    if (today > endDate)
      return { text: "Completed", color: "bg-gray-100 text-gray-800" };
    return { text: "Active", color: "bg-emerald-100 text-emerald-800" };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Academic Year
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Period
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Terms
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {academicYears.map((year) => {
            const status = getStatus(year);
            return (
              <tr key={year.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {year.is_current && (
                      <StarIcon className="w-5 h-5 text-yellow-500 mr-2" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {year.year_label}
                      </div>
                      {year.is_current && (
                        <div className="text-xs text-gray-500">
                          Current Year
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(year.start_date)} - {formatDate(year.end_date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.ceil(
                      (new Date(year.end_date) - new Date(year.start_date)) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                  >
                    {status.text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                    {year.term_count || 0} terms
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {!year.is_current && (
                      <button
                        onClick={() => onSetCurrent(year.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Set as Current"
                      >
                        <StarIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(year)}
                      className="text-emerald-600 hover:text-emerald-900"
                      title="Edit Academic Year"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(year.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Academic Year"
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
  );
};

export default AcademicYearTable;
