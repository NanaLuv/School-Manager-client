// components/classes/ClassTeacherTable.js
import React from "react";
import { PencilIcon, TrashIcon, StarIcon } from "@heroicons/react/24/outline";

const ClassTeacherTable = ({
  classTeachers,
  onEdit,
  onDelete,
  emptyMessage,
}) => {
  if (!classTeachers || classTeachers.length === 0) {
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
              Class
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teacher
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Academic Year
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {classTeachers.map((assignment) => (
            <tr key={assignment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {assignment.class_name}
                </div>
                <div className="text-sm text-gray-500">
                  {assignment.room_number || "No room"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {assignment.teacher_first_name} {assignment.teacher_last_name}
                </div>
                <div className="text-sm text-gray-500">
                  {assignment.teacher_email}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 font-mono">
                  {assignment.employee_id}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {assignment.is_main_teacher ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                    <StarIcon className="w-3 h-3 mr-1" />
                    Main Teacher
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                    Assistant Teacher
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {assignment.academic_year}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(assignment)}
                    className="text-emerald-600 hover:text-emerald-900 transition-colors"
                    title="Edit Assignment"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(assignment.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Remove Assignment"
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

export default ClassTeacherTable;
