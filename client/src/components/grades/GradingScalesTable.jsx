// components/grades/GradingScalesTable.js
import React from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const GradingScalesTable = ({
  gradingScales,
  onEdit,
  onDelete,
  emptyMessage,
}) => {
  if (!gradingScales || gradingScales.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score Range
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Grade
            </th>
            
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Remarks
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {gradingScales.map((scale) => (
            <tr key={scale.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {scale.min_score} - {scale.max_score}
                </div>
                <div className="text-xs text-gray-500">
                  {scale.max_score - scale.min_score + 1} points range
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-1 text-sm font-bold bg-blue-100 text-blue-800 rounded-full">
                  {scale.grade}
                </span>
              </td>
              
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{scale.remarks}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(scale)}
                    className="text-emerald-600 hover:text-emerald-900 transition-colors"
                    title="Edit Grading Scale"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(scale.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Delete Grading Scale"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GradingScalesTable;
