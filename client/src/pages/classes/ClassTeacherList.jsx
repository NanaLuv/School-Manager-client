// pages/ClassTeachersList.js
import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ClassTeacherTable from "../../components/classes/ClassTeacherTable";
import ClassTeacherForm from "../../components/classes/ClassTeacherForm";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const ClassTeachersList = () => {
  const [classTeachers, setClassTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const getClassTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "/getclassteachers"
      );
      setClassTeachers(response.data);
      console.log("fetched class teachers:", response.data)
    } catch (error) {
      console.error("Error fetching class teachers:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getClassTeachers();
  }, []);

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this teacher from the class?"
      )
    ) {
      try {
        await api.delete(
          `/deleteclassteacher/${assignmentId}`
        );
        getClassTeachers();
      } catch (error) {
        console.error("Error deleting class teacher:", error);
        alert(
          "Error removing teacher assignment: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  const handleSaveAssignment = async (assignmentData) => {
    try {
      if (editingAssignment) {
        await api.put(
          `/updateclassteacher/${editingAssignment.id}`,
          assignmentData
        );
      } else {
        await api.post(
          "/assignclassteacher",
          assignmentData
        );
      }
      setIsModalOpen(false);
      getClassTeachers();
    } catch (error) {
      console.error("Error saving class teacher assignment:", error);
      alert(
        "Error saving assignment: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  // Calculate statistics
  const mainTeachersCount = classTeachers.filter(
    (ct) => ct.is_main_teacher
  ).length;
  const assistantTeachersCount = classTeachers.filter(
    (ct) => !ct.is_main_teacher
  ).length;
  const classesWithTeachers = [
    ...new Set(classTeachers.map((ct) => ct.class_id)),
  ].length;

  if (loading) {
    return <LoadingSpinner text="Loading class teachers..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Class Teacher Management
          </h1>
          <p className="text-gray-600">
            Assign teachers to classes for the current academic year
          </p>
        </div>
        <button
          onClick={handleAddAssignment}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Assign Teacher</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {classTeachers.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Main Teachers</p>
              <p className="text-2xl font-bold text-gray-900">
                {mainTeachersCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AcademicCapIcon className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Assistant Teachers</p>
              <p className="text-2xl font-bold text-gray-900">
                {assistantTeachersCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div>
            <p className="text-sm text-gray-600">Classes with Teachers</p>
            <p className="text-2xl font-bold text-gray-900">
              {classesWithTeachers}
            </p>
          </div>
        </div>
      </div>

      {/* Class Teachers Table */}
      <div className="bg-white rounded-lg shadow">
        <ClassTeacherTable
          classTeachers={classTeachers}
          onEdit={handleEditAssignment}
          onDelete={handleDeleteAssignment}
          emptyMessage="No teacher assignments found. Click 'Assign Teacher' to create the first one."
        />
      </div>

      {/* Assign/Edit Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingAssignment
            ? "Edit Teacher Assignment"
            : "Assign Teacher to Class"
        }
        size="medium"
      >
        <ClassTeacherForm
          assignment={editingAssignment}
          onSave={handleSaveAssignment}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ClassTeachersList;
