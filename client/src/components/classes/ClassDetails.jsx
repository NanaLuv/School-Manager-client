// components/classes/ClassDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const fetchClassDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3001/schmgt/getclasses/${id}/students`
      );
      setClassData(response.data);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error("Error fetching class details:", error);
    }
    setLoading(false);
  };

  const handleExportStudents = async () => {
    setExporting(true);
    try {
      const response = await axios.get(
        `http://localhost:3001/schmgt/getclasses/${id}/export-students`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `class_${classData.class_name}_students_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting students:", error);
      alert("Error exporting students. Please try again.");
    }
    setExporting(false);
  };

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

  if (loading) {
    return <LoadingSpinner text="Loading class details..." />;
  }

  if (!classData) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Class not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/classes/list")}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Classes
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {classData.class_name}
            </h1>
            <p className="text-gray-600">Class details and student roster</p>
          </div>
        </div>

        {/* Export Button */}
        {students.length > 0 && (
          <button
            onClick={handleExportStudents}
            disabled={exporting}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>
              {exporting
                ? "Exporting..."
                : `Export Students (${students.length})`}
            </span>
          </button>
        )}
      </div>

      {/* Class Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <UserIcon className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {classData.current_student_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {classData.capacity || "No limit"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div>
            <p className="text-sm text-gray-600">Room Number</p>
            <p className="text-2xl font-bold text-gray-900">
              {classData.room_number || "Not assigned"}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div>
            <p className="text-sm text-gray-600">Capacity Status</p>
            <p
              className={`text-lg font-bold ${
                classData.capacity_status === "error"
                  ? "text-red-600"
                  : classData.capacity_status === "warning"
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            >
              {classData.capacity_percentage || "No limit"}
            </p>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Active Students in this Class ({students.length})
              {classData.inactive_student_count > 0 && (
                <span className="text-sm text-orange-600 ml-2">
                  ({classData.inactive_student_count} inactive students not
                  shown)
                </span>
              )}
            </h2>
          </div>

          {students.length > 0 && (
            <button
              onClick={handleExportStudents}
              disabled={exporting}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>{exporting ? "Exporting..." : "Export to Excel"}</span>
            </button>
          )}
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No students assigned to this class</p>
          </div>
        ) : (
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
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent/Guardian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-800 font-medium text-sm">
                            {student.first_name?.[0]}
                            {student.last_name?.[0]}
                          </span>
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
                      <div className="text-sm text-gray-900">
                        {calculateAge(student.date_of_birth)} years
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.parent_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.parent_contact}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.promotion_status === "Promoted"
                            ? "bg-green-100 text-green-800"
                            : student.promotion_status === "Not Promoted"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {student.promotion_status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
