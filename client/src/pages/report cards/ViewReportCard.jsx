import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  AcademicCapIcon,
  ChartBarIcon,
  UserIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const ViewReportCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [comments, setComments] = useState({
    overall_comment: "",
    teacher_comment: "",
    principal_comment: "",
    overall_position: "",
    attendance_days: "",
    total_days: "",
    student_interest: "",
    promoted_to_class_id: "",
  });

  useEffect(() => {
    fetchReportCard();
    fetchClasses();
  }, [id]);

  const fetchReportCard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/getreportcard/${id}`);
      setReportCard(response.data);
      setComments({
        overall_comment: response.data.overall_comment || "",
        teacher_comment: response.data.teacher_comment || "",
        principal_comment: response.data.principal_comment || "",
        overall_position: response.data.overall_position || "",
        attendance_days: response.data.attendance_days || "",
        total_days: response.data.total_days || "",
        student_interest: response.data.student_interest || "",
        promoted_to_class_id: response.data.promoted_to_class_id || "",
      });
    } catch (error) {
      console.error("Error fetching report card:", error);
      alert("Error loading report card");
    }
    setLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get("/getclasses");
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const handleSaveComments = async () => {
    setSaving(true);
    try {
      await api.put(`/updatereportcard/${id}`, comments);

      setReportCard((prev) => ({ ...prev, ...comments }));
      setEditing(false);
      alert("Report card updated successfully");
    } catch (error) {
      console.error("Error updating report card:", error);
      alert("Error updating report card");
    }
    setSaving(false);
  };

  const getGradeColor = (total) => {
    if (total >= 80) return "text-green-600 bg-green-100";
    if (total >= 70) return "text-blue-600 bg-blue-100";
    if (total >= 60) return "text-yellow-600 bg-yellow-100";
    if (total >= 50) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getRemarksColor = (remarks) => {
    if (remarks?.includes("Excellent") || remarks?.includes("Very Good"))
      return "text-green-700";
    if (remarks?.includes("Good") || remarks?.includes("Credit"))
      return "text-blue-700";
    if (remarks?.includes("Pass")) return "text-yellow-700";
    if (remarks?.includes("Fail") || remarks?.includes("Poor"))
      return "text-red-700";
    return "text-gray-700";
  };

  if (loading) {
    return <LoadingSpinner text="Loading report card..." />;
  }

  if (!reportCard) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Report Card Not Found
        </h1>
        <button
          onClick={() => navigate("/academics/report-cards")}
          className="mt-4 text-blue-500 hover:text-blue-700"
        >
          Back to Report Cards
        </button>
      </div>
    );
  }
  const getOrdinalSuffix = (position) => {
    if (position === 1) return "1st";
    if (position === 2) return "2nd";
    if (position === 3) return "3rd";
    return `${position}th`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/academics/report-cards")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Report Cards</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Card</h1>
            <p className="text-gray-600">
              {reportCard.academic_year} - {reportCard.term_name}
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit Report Card</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveComments}
                disabled={saving}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setComments({
                    overall_comment: reportCard.overall_comment || "",
                    teacher_comment: reportCard.teacher_comment || "",
                    principal_comment: reportCard.principal_comment || "",
                    overall_position: reportCard.overall_position || "",
                    attendance_days: reportCard.attendance_days || "",
                    total_days: reportCard.total_days || "",
                    student_interest: reportCard.student_interest || "",
                    promoted_to_class_id: reportCard.promoted_to_class_id || "",
                  });
                }}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Card Content */}
      <div className="bg-white rounded-lg shadow border print:shadow-none">
        {/* School Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg text-center">
          <h1 className="text-3xl font-bold mb-2">PREVIEW</h1>
          <p className="text-lg opacity-90">Report Card</p>
          <p className="text-sm opacity-80 mt-1">
            {reportCard.academic_year} - {reportCard.term_name}
          </p>
        </div>

        {/* Student Information */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Student Information
              </h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-gray-600">Name:</span>
                  <span className="font-medium">
                    {reportCard.first_name} {reportCard.last_name}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-600">Admission No:</span>
                  <span className="font-medium">
                    {reportCard.admission_number}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-600">Class:</span>
                  <span className="font-medium">{reportCard.class_name}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                Academic Information
              </h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="w-32 text-gray-600">Academic Year:</span>
                  <span className="font-medium">
                    {reportCard.academic_year}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-600">Term:</span>
                  <span className="font-medium">{reportCard.term_name}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-600">Date Issued:</span>
                  <span className="font-medium">
                    {new Date(reportCard.date_issued).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Grades Table */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Subject Performance
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportCard.details?.map((detail, index) => (
                  <tr
                    key={detail.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {detail.subject_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {detail.subject_code}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {detail.class_score || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {detail.exam_score || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(
                          detail.subject_total,
                        )}`}
                      >
                        {detail.subject_total || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {detail.subject_position ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {getOrdinalSuffix(detail.subject_position)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {detail.grade || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={getRemarksColor(detail.remarks)}>
                        {detail.remarks || "No remarks"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NEW: Additional Information Section */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Attendance
              </h4>

              {editing ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={comments.attendance_days}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          attendance_days: e.target.value,
                        }))
                      }
                      placeholder="Days present"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-600">out of</span>
                    <input
                      type="number"
                      value={comments.total_days}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          total_days: e.target.value,
                        }))
                      }
                      placeholder="Total days"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-blue-600">
                    {reportCard.attendance_days || 0}
                  </span>
                  <span className="text-gray-600">out of</span>
                  <span className="text-lg font-semibold text-gray-700">
                    {reportCard.total_days || 0}
                  </span>
                  <span className="text-gray-600">days</span>
                  {reportCard.attendance_days && reportCard.total_days && (
                    <span className="text-sm text-gray-500">
                      (
                      {Math.round(
                        (reportCard.attendance_days / reportCard.total_days) *
                          100,
                      )}
                      %)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Promotion */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center">
                <ArrowRightIcon className="w-4 h-4 mr-2" />
                Promotion Status
              </h4>

              {editing ? (
                <div>
                  <select
                    value={comments.promoted_to_class_id}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        promoted_to_class_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select class for promotion</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  {reportCard.promoted_to_class_name ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-semibold">
                        Promoted to:
                      </span>
                      <span className="font-medium">
                        {reportCard.promoted_to_class_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">
                      Promotion not specified
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Student Interest */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              Student Interests & Strengths
            </h4>

            {editing ? (
              <textarea
                value={comments.student_interest}
                onChange={(e) =>
                  setComments((prev) => ({
                    ...prev,
                    student_interest: e.target.value,
                  }))
                }
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe student's interests, strengths, and areas of excellence..."
              />
            ) : (
              <p className="text-gray-900 bg-white p-3 rounded border min-h-[60px]">
                {reportCard.student_interest || (
                  <span className="text-gray-500 italic">
                    No interests specified
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Comments Section - Updated with new fields */}
        <div className="p-6 border-t bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comments & Remarks
          </h3>

          <div className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher's Comment
                  </label>
                  <textarea
                    value={comments.teacher_comment}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        teacher_comment: e.target.value,
                      }))
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Teacher's remarks..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Comment
                  </label>
                  <textarea
                    value={comments.overall_comment}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        overall_comment: e.target.value,
                      }))
                    }
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Overall performance comment..."
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Principal's Comment
                  </label>
                  <textarea
                    value={comments.principal_comment}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        principal_comment: e.target.value,
                      }))
                    }
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Principal's remarks..."
                  />
                </div> */}
              </>
            ) : (
              <>
                {reportCard.teacher_comment && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Teacher's Comment:
                    </h4>
                    <p className="text-gray-900 bg-white p-3 rounded border">
                      {reportCard.teacher_comment}
                    </p>
                  </div>
                )}
                {reportCard.overall_comment && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Overall Comment:
                    </h4>
                    <p className="text-gray-900 bg-white p-3 rounded border">
                      {reportCard.overall_comment}
                    </p>
                  </div>
                )}

                {/* {reportCard.principal_comment && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">
                      Principal's Comment:
                    </h4>
                    <p className="text-gray-900 bg-white p-3 rounded border">
                      {reportCard.principal_comment}
                    </p>
                  </div>
                )} */}

                {!reportCard.overall_comment && !reportCard.teacher_comment && (
                  <p className="text-gray-500 italic">No comments added yet.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-white rounded-b-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Generated for Preview</p>
              <p className="text-xs text-gray-500">
                Issued on:{" "}
                {new Date(reportCard.date_issued).toLocaleDateString()}
              </p>
            </div>
            {reportCard.issued_by_name && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Signed:</p>
                <p className="text-sm text-gray-600">
                  {reportCard.issued_by_name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReportCard;
