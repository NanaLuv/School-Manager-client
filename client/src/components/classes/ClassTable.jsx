// components/classes/ClassTable.js
import React from "react";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../pages/contexts/AuthContext";

const ClassTable = ({ classes, onEdit, onDelete, emptyMessage }) => {
  const navigate = useNavigate();
const {user} = useAuth()
  const handleRowClick = (classItem) => {
    navigate(`/classes/${classItem.id}`);
  };

  if (!classes || classes.length === 0) {
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
              Class Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Room Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capacity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Students
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
          {classes.map((classItem) => (
            <tr
              key={classItem.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleRowClick(classItem)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {classItem.class_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {classItem.room_number || "Not assigned"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {classItem.capacity || "Not set"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {classItem.current_student_count || 0}
                  {classItem.capacity && ` / ${classItem.capacity}`}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    classItem.capacity_status === "error"
                      ? "bg-red-100 text-red-800"
                      : classItem.capacity_status === "warning"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {classItem.capacity_percentage || "No limit"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div
                  className="flex space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleRowClick(classItem)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Class Details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  {user.role_name.toLowerCase() === "admin" && (
                    <>
                      <button
                        onClick={() => onEdit(classItem)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Edit Class"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(classItem.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Class"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassTable;
