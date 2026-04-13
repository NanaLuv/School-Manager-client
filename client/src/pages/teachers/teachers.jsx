import React, { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import TeacherForm from "../../components/teachers/TeacherForm";
import TeacherTable from "../../components/teachers/TeacherTable";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const getTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "/getteachers"
      );
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getTeachers();
  }, []);

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await api.delete(
          `/deleteteacher/${teacherId}`
        );
        getTeachers();
      } catch (error) {
        console.error("Error deleting teacher:", error);
      }
    }
  };

  const handleSaveTeacher = async (teacherData) => {
    try {
      if (editingTeacher) {
        await api.put(
          `/updateteacher/${editingTeacher.id}`,
          teacherData
        );
      } else {
        await api.post(
          "/createteacher",
          teacherData
        );
      }
      setIsModalOpen(false);
      getTeachers();
    } catch (error) {
      console.error("Error saving teacher:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading teachers..." />;
  }

  return (
    <div className="p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
            Teacher Management
          </h1>
          <p className="text-gray-600">Manage all teachers in the school</p>
        </div>
        <button
          onClick={handleAddTeacher}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Total Teachers</p>
          <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Active Teachers</p>
          <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-lg font-semibold text-gray-900">Today</p>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow">
        <TeacherTable
          teachers={teachers}
          onEdit={handleEditTeacher}
          onDelete={handleDeleteTeacher}
          emptyMessage="No teachers found. Click 'Add Teacher' to create the first one."
        />
      </div>

      {/* Add/Edit Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? "Edit Teacher" : "Add New Teacher"}
        size="medium"
      >
        <TeacherForm
          teacher={editingTeacher}
          onSave={handleSaveTeacher}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default TeacherList;
