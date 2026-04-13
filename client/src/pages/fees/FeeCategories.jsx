import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import api from "../../components/axiosconfig/axiosConfig";

const FeeCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        "/getfeecategories"
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching fee categories:", error);
      alert("Error loading fee categories");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_name.trim()) {
      alert("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Update existing category
        await api.put(
          `/updatefeecategory/${editingCategory.id}`,
          formData
        );
        alert("Fee category updated successfully!");
      } else {
        // Create new category
        await api.post(
          "/createfeecategory",
          formData
        );
        alert("Fee category created successfully!");
      }

    //   setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error saving fee category:", error);
      alert(
        "Error saving fee category: " +
          (error.response?.data?.error || error.message)
      );
    }
    setSubmitting(false);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${category.category_name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/deletefeecategory/${category.id}`
      );
      alert("Fee category deleted successfully!");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting fee category:", error);
      alert(
        "Error deleting fee category: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const resetForm = () => {
    setFormData({
      category_name: "",
      description: "",
    });
    setEditingCategory(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return <LoadingSpinner text="Loading fee categories..." />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Categories</h1>
          <p className="text-gray-600">
            Manage different types of fees and charges
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow border p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.category_name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">ID: {category.id}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Fee Categories
          </h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first fee category.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Category</span>
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingCategory ? "Edit Fee Category" : "Add New Fee Category"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., Tuition Fee, Sports Fee"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Optional description of this fee category..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    <span>
                      {submitting
                        ? "Saving..."
                        : editingCategory
                        ? "Update Category"
                        : "Create Category"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCategories;
