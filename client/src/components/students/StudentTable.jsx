import React from "react";
import {
  PencilIcon,
  UserIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const StudentTable = ({
  students,
  onEdit,
  onDeactivate,
  onActivate,
  onView,
  emptyMessage,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "Unknown";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Helper function to get photo URL
  const getPhotoUrl = (student) => {
    if (!student.photo_filename) return null;

    // Try different URL formats
    const baseUrl = "http://localhost:3001";
    const photoUrl = `${baseUrl}/uploads/students/${student.photo_filename}`;
    return photoUrl;
  };

  // Helper to check if student is active
  const isStudentActive = (student) => {
    // Handle different possible values from backend
    return (
      student.is_active !== false &&
      student.is_active !== 0 &&
      student.is_active !== "false"
    );
  };

  // Helper to check fee block
  const hasFeeBlock = (student) => {
    return (
      student.has_fee_block === true ||
      student.has_fee_block === 1 ||
      student.has_fee_block === "true"
    );
  };

  if (!students || students.length === 0) {
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
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Admission No.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Class
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Parent/Guardian
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enrollment Date
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
          {students.map((student) => {
            const photoUrl = getPhotoUrl(student);
            const isActive = isStudentActive(student);
            const hasFee = hasFeeBlock(student);

            return (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={`${student.first_name} ${student.last_name}`}
                          className="h-12 w-12 rounded-full object-cover border border-gray-300"
                          onError={(e) => {
                            // If image fails to load, fall back to initials
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`h-12 w-12 rounded-full flex items-center justify-center border border-gray-300 ${
                          photoUrl ? "hidden" : "flex"
                        } ${isActive ? "bg-purple-100" : "bg-gray-100"}`}
                      >
                        <span
                          className={`font-medium text-sm ${
                            isActive ? "text-purple-800" : "text-gray-600"
                          }`}
                        >
                          {student.first_name?.[0]}
                          {student.last_name?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {student.gender?.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-gray-900 font-medium">
                    {student.admission_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-gray-900 font-medium">
                    {student.class_name || "not assigned"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {calculateAge(student.date_of_birth)} years
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {student.parent_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {student.parent_contact}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(student.enrolled_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    {hasFee && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        Fee Block
                      </span>
                    )}
                    {isActive ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView?.(student)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="View Student Details"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(student)}
                      className="text-emerald-600 hover:text-emerald-900 transition-colors"
                      title="Edit Student"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    {isActive ? (
                      <button
                        onClick={() => onDeactivate(student.id)}
                        className="text-orange-600 hover:text-orange-900 transition-colors"
                        title="Deactivate Student"
                      >
                        <UserIcon className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onActivate(student.id)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Activate Student"
                      >
                        <UserIcon className="w-5 h-5" />
                      </button>
                    )}
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

export default StudentTable;
