import React, { useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Table from "../common/Table";
import LoadingSpinner from "../common/LoadingSpinner";

const SubjectTable = ({
  subjects,
  loading,
  onEdit,
  onDelete,
  onView,
  emptyMessage = "No subjects found",
  showActions = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subject.description &&
        subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    {
      key: "subject_code",
      header: "Subject Code",
      render: (subject) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {subject.subject_code.charAt(0)}
            </span>
          </div>
          <div>
            <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {subject.subject_code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "subject_name",
      header: "Subject Name",
      render: (subject) => (
        <div>
          <p className="font-medium text-gray-900">{subject.subject_name}</p>
          {subject.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {subject.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (subject) => (
        <div className="text-sm text-gray-500">
          {subject.created_at
            ? new Date(subject.created_at).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
  ];

  // Add actions column if showActions is true
  if (showActions) {
    columns.push({
      key: "actions",
      header: "Actions",
      render: (subject) => (
        <div className="flex space-x-2">
          {onView && (
            <button
              onClick={() => onView(subject)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(subject)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Edit Subject"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(subject)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Subject"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    });
  }

  if (loading) {
    return <LoadingSpinner text="loading Subjects..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {filteredSubjects.length} of {subjects.length} subjects
          {searchTerm && (
            <span className="ml-1">
              matching "<span className="font-medium">{searchTerm}</span>"
            </span>
          )}
        </p>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredSubjects}
        loading={loading}
        emptyMessage={emptyMessage}
      />

      {/* No Results Message */}
      {!loading && searchTerm && filteredSubjects.length === 0 && (
        <div className="p-8 text-center">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No subjects found
          </h3>
          <p className="text-gray-500">
            No subjects match your search for "
            <span className="font-medium">{searchTerm}</span>". Try adjusting
            your search terms.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubjectTable;
