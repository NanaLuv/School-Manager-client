// components/students/StudentDetailsModal.js
import React, { useState } from "react";
import {
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";

const StudentDetailsModal = ({ student, isOpen, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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

  const isActive = student.is_active !== false && student.is_active !== 0;
  const hasFeeBlock =
    student.has_fee_block === true || student.has_fee_block === 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {student.photo_filename ? (
                <div className="relative">
                  <img
                    src={`http://localhost:3001/uploads/students/${student.photo_filename}`}
                    alt={`${student.first_name} ${student.last_name}`}
                    className={`h-16 w-16 rounded-full object-cover border-4 border-white shadow-lg ${
                      !imageLoaded ? "hidden" : ""
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageError(true);
                      setImageLoaded(false);
                    }}
                  />
                  {!imageLoaded && !imageError && (
                    <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse border-4 border-white shadow-lg"></div>
                  )}
                  {imageError && (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {student.first_name?.[0]}
                        {student.last_name?.[0]}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {student.first_name?.[0]}
                    {student.last_name?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {student.first_name} {student.last_name}
              </h2>
              <p className="text-gray-600">{student.admission_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-full"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* Status Badges */}
            <div className="flex space-x-3 mb-6">
              {isActive ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Active Student
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Inactive Student
                </span>
              )}
              {hasFeeBlock && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Fee Block Active
                </span>
              )}
              {student.class_name && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {student.class_name}
                  {student.room_number && ` (${student.room_number})`}
                </span>
              )}
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {student.gender?.toLowerCase() || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(student.date_of_birth)}
                        {student.date_of_birth && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({calculateAge(student.date_of_birth)} years old)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Enrollment Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(student.enrolled_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Parent/Guardian Information
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Parent/Guardian Name
                      </p>
                      <p className="font-medium text-gray-900">
                        {student.parent_name || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Contact Information
                      </p>
                      <p className="font-medium text-gray-900">
                        {student.parent_contact || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">
                        Parent Email
                      </p>
                      <p className="font-medium text-gray-900">
                        {student.parent_email || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {student.address && (
                <div className="space-y-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Address
                  </h3>
                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <p className="text-gray-900 leading-relaxed">
                      {student.address}
                    </p>
                  </div>
                </div>
              )}

              {/* Academic Information */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Academic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <AcademicCapIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Current Class</p>
                      <p className="font-medium text-gray-900">
                        {student.class_name || "Not assigned"}
                        {student.room_number && ` • ${student.room_number}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Academic Year</p>
                      <p className="font-medium text-gray-900">
                        {student.academic_year || "Not assigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <AcademicCapIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Promotion Status</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {student.promotion_status?.toLowerCase() || "Pending"}
                      </p>
                    </div>
                  </div>

                  {student.class_assignment_date && (
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">
                          Class Assignment Date
                        </p>
                        <p className="font-medium text-gray-900">
                          {formatDate(student.class_assignment_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;
