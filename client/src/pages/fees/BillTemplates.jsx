import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CalendarIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axios from "axios";
import { useAcademicData } from "../../hooks/useAcademicContext";
import api from "../../components/axiosconfig/axiosConfig";

const BillTemplates = () => {
  const {
    academicYears,
    terms,
    selectedAcademicYear,
    selectedTerm,
    handleAcademicYearChange,
    handleTermChange,
    loading: academicLoading,
    getSelectedAcademicYear,
    getSelectedTerm,
  } = useAcademicData();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [feeCategories, setFeeCategories] = useState([]);

  // Filter and view state
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("current"); // 'current', 'class', 'year', 'all'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    class_id: "",
    academic_year_id: selectedAcademicYear || "",
    term_id: selectedTerm || "",
    fee_category_id: "",
    amount: "",
    due_date: "",
    is_compulsory: true,
    description: "",
  });

  // Update form data when academic selections change
  useEffect(() => {
    if (selectedAcademicYear) {
      setFormData((prev) => ({
        ...prev,
        academic_year_id: selectedAcademicYear,
      }));
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedTerm) {
      setFormData((prev) => ({
        ...prev,
        term_id: selectedTerm,
      }));
    }
  }, [selectedTerm]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, classesRes, categoriesRes] = await Promise.all([
        api.get("/getbilltemplates"),
        api.get("/getclasses"),
        api.get("/getfeecategories"),
      ]);

      setTemplates(templatesRes.data);
      setClasses(classesRes.data);
      setFeeCategories(categoriesRes.data);

      // Auto-expand current year templates by default
      const initialExpanded = {};
      if (selectedAcademicYear) {
        initialExpanded[`year-${selectedAcademicYear}`] = true;
      }
      setExpandedGroups(initialExpanded);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data");
    }
    setLoading(false);
  };

  // Filter templates based on selections
  const getFilteredTemplates = () => {
    let filtered = [...templates];

    // Filter by class
    if (selectedClassId !== "all") {
      filtered = filtered.filter(
        (template) => template.class_id == selectedClassId
      );
    }

    // Filter by academic year (use selectedAcademicYear from context)
    if (selectedAcademicYear) {
      filtered = filtered.filter(
        (template) => template.academic_year_id == selectedAcademicYear
      );
    }

    // Filter by term (use selectedTerm from context)
    if (selectedTerm) {
      filtered = filtered.filter(
        (template) => template.term_id == selectedTerm
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          getClassName(template.class_id)?.toLowerCase().includes(term) ||
          getYearLabel(template.academic_year_id)
            ?.toLowerCase()
            .includes(term) ||
          getTermName(template.term_id)?.toLowerCase().includes(term) ||
          getFeeCategoryName(template.fee_category_id)
            ?.toLowerCase()
            .includes(term) ||
          template.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  // Group templates for display based on view mode
  const getGroupedTemplates = () => {
    const filteredTemplates = getFilteredTemplates();

    switch (viewMode) {
      case "current":
        return groupByClassForCurrentYear(filteredTemplates);
      case "class":
        return groupByClass(filteredTemplates);
      case "year":
        return groupByAcademicYear(filteredTemplates);
      case "all":
      default:
        return groupByClassAndYear(filteredTemplates);
    }
  };

  // Group templates by class for current year
  const groupByClassForCurrentYear = (templates) => {
    const currentYearTemplates = templates.filter(
      (template) => template.academic_year_id == selectedAcademicYear
    );

    return currentYearTemplates.reduce((acc, template) => {
      const classId = template.class_id;
      if (!acc[classId]) {
        acc[classId] = {
          classInfo: classes.find((c) => c.id === classId),
          templates: [],
        };
      }
      acc[classId].templates.push(template);
      return acc;
    }, {});
  };

  // Group templates by class only
  const groupByClass = (templates) => {
    return templates.reduce((acc, template) => {
      const classId = template.class_id;
      if (!acc[classId]) {
        acc[classId] = {
          classInfo: classes.find((c) => c.id === classId),
          templates: [],
        };
      }
      acc[classId].templates.push(template);
      return acc;
    }, {});
  };

  // Group templates by academic year only
  const groupByAcademicYear = (templates) => {
    return templates.reduce((acc, template) => {
      const yearId = template.academic_year_id;
      if (!acc[yearId]) {
        acc[yearId] = {
          yearInfo: academicYears.find((y) => y.id === yearId),
          templates: [],
        };
      }
      acc[yearId].templates.push(template);
      return acc;
    }, {});
  };

  // Group templates by both class and year
  const groupByClassAndYear = (templates) => {
    return templates.reduce((acc, template) => {
      const classId = template.class_id;
      const yearId = template.academic_year_id;

      if (!acc[classId]) {
        acc[classId] = {
          classInfo: classes.find((c) => c.id === classId),
          yearGroups: {},
        };
      }

      if (!acc[classId].yearGroups[yearId]) {
        acc[classId].yearGroups[yearId] = {
          yearInfo: academicYears.find((y) => y.id === yearId),
          templates: [],
        };
      }

      acc[classId].yearGroups[yearId].templates.push(template);
      return acc;
    }, {});
  };

  // Helper functions
  const getClassName = (classId) => {
    return classes.find((c) => c.id === classId)?.class_name || "Unknown Class";
  };

  const getYearLabel = (yearId) => {
    return (
      academicYears.find((y) => y.id === yearId)?.year_label || "Unknown Year"
    );
  };

  const getTermName = (termId) => {
    return terms.find((t) => t.id === termId)?.term_name || "Unknown Term";
  };

  const getFeeCategoryName = (categoryId) => {
    return (
      feeCategories.find((fc) => fc.id === categoryId)?.category_name ||
      "Unknown Category"
    );
  };

  // Calculate fee totals
  const calculateFeeTotals = (templates) => {
    return templates.reduce(
      (totals, template) => {
        const amount = parseFloat(template.amount);
        if (template.is_compulsory) {
          totals.compulsory += amount;
        } else {
          totals.optional += amount;
        }
        totals.total += amount;
        return totals;
      },
      { compulsory: 0, optional: 0, total: 0 }
    );
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.class_id ||
      !formData.academic_year_id ||
      !formData.term_id ||
      !formData.fee_category_id ||
      !formData.amount ||
      !formData.due_date
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.amount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      if (editingTemplate) {
        await api.put(
          `/updatebilltemplate/${editingTemplate.id}`,
          formData
        );
        alert("Bill template updated successfully!");
        setShowModal(false);
        resetForm();
      } else {
        await api.post(
          "/createbilltemplate",
          formData
        );
        alert("Bill template created successfully!");

        // Keep the selections but clear amount, date, and description
        setFormData({
          ...formData,
          amount: "",
          due_date: "",
          description: "",
          is_compulsory: true,
          fee_category_id: "", // Optional: keep or clear category
        });
      }

      fetchData();
    } catch (error) {
      console.error("Error saving bill template:", error);
      alert(
        "Error saving bill template: " +
          (error.response?.data?.error || error.message)
      );
    }
    setSubmitting(false);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      class_id: template.class_id,
      academic_year_id: template.academic_year_id,
      term_id: template.term_id,
      fee_category_id: template.fee_category_id,
      amount: template.amount,
      due_date: template.due_date.split("T")[0],
      is_compulsory: template.is_compulsory,
      description: template.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (template) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this bill template? This will not affect existing student bills.`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/deletebilltemplate/${template.id}`
      );
      alert("Bill template deleted successfully!");
      fetchData();
    } catch (error) {
      console.error("Error deleting bill template:", error);
      alert(
        "Error deleting bill template: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const resetForm = () => {
    // When resetting, keep filters if they exist
    const newFormData = {
      class_id: selectedClassId !== "all" ? selectedClassId : "",
      academic_year_id: selectedAcademicYear || "",
      term_id: selectedTerm || "",
      fee_category_id: "",
      amount: "",
      due_date: "",
      is_compulsory: true,
      description: "",
    };

    setFormData(newFormData);
    setEditingTemplate(null);
  };

  const handleAddNew = () => {
    // Reset form with smart defaults based on filters and context
    const newFormData = {
      class_id: selectedClassId !== "all" ? selectedClassId : "",
      academic_year_id: selectedAcademicYear || "",
      term_id: selectedTerm || "",
      fee_category_id: "",
      amount: "",
      due_date: getDefaultDueDate(),
      is_compulsory: true,
      description: "",
    };

    setFormData(newFormData);
    setEditingTemplate(null);
    setShowModal(true);
  };

  // Helper function to get default due date
  const getDefaultDueDate = () => {
    // Set default due date to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    return defaultDate.toISOString().split("T")[0];
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (!editingTemplate) {
      // Only reset if not editing - keep selections for next time
      setFormData({
        class_id: selectedClassId !== "all" ? selectedClassId : "",
        academic_year_id: selectedAcademicYear || "",
        term_id: selectedTerm || "",
        fee_category_id: "",
        amount: "",
        due_date: "",
        is_compulsory: true,
        description: "",
      });
    } else {
      resetForm();
    }
    setEditingTemplate(null);
  };

  const clearFilters = () => {
    setSelectedClassId("all");
    setSearchTerm("");
    setViewMode("current");
  };

  // Get total count for each view mode
  const getTotalCount = () => {
    return getFilteredTemplates().length;
  };

  if (academicLoading || loading) {
    return <LoadingSpinner text="Loading bill templates..." />;
  }

  const selectedYear = getSelectedAcademicYear();
  const selectedTermObj = getSelectedTerm();

  const groupedTemplates = getGroupedTemplates();
  const filteredTemplates = getFilteredTemplates();
  const totalCount = getTotalCount();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill Templates</h1>
          <p className="text-gray-600">
            Create and manage fee templates for classes
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Academic Context Display */}
      <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-xs text-gray-500">Selected Year</div>
              <div className="font-semibold text-gray-900">
                {selectedYear?.year_label || "Not selected"}
                {selectedYear?.is_current && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Selected Term</div>
              <div className="font-semibold text-gray-900">
                {selectedTermObj?.term_name || "Not selected"}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedAcademicYear || ""}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year_label}
                  {year.is_current && " (Current)"}
                </option>
              ))}
            </select>

            <select
              value={selectedTerm || ""}
              onChange={(e) => handleTermChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedAcademicYear}
            >
              <option value="">Select Term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.term_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Bill Templates Overview
            </h3>
            <p className="text-sm text-gray-600">
              {totalCount} template(s) found • Showing templates for{" "}
              {selectedYear?.year_label || "selected year"} -{" "}
              {selectedTermObj?.term_name || "selected term"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalCount}
              </div>
              <div className="text-sm text-gray-500">Total Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {filteredTemplates.filter((t) => t.is_compulsory).length}
              </div>
              <div className="text-sm text-gray-500">Compulsory</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredTemplates.filter((t) => !t.is_compulsory).length}
              </div>
              <div className="text-sm text-gray-500">Optional</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <FunnelIcon className="w-5 h-5" />
                <span>Filters</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setViewMode("current")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === "current"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Current Year
                </button>
                <button
                  onClick={() => setViewMode("class")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === "class"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  By Class
                </button>
                <button
                  onClick={() => setViewMode("year")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === "year"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  By Year
                </button>
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1 rounded-md text-sm ${
                    viewMode === "all"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Details
                </button>
              </div>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year (from context)
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                  {selectedYear?.year_label || "No year selected"}
                  {selectedYear?.is_current && " (Current)"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term (from context)
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-700">
                  {selectedTermObj?.term_name || "No term selected"}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>Clear All Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grouped Templates Display */}
      <div className="space-y-4">
        {Object.keys(groupedTemplates).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Templates Found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedClassId !== "all"
                ? "Try adjusting your filters to see more results."
                : `No templates found for ${
                    selectedYear?.year_label || "selected year"
                  } - ${selectedTermObj?.term_name || "selected term"}`}
            </p>
            {!searchTerm && selectedClassId === "all" && (
              <button
                onClick={handleAddNew}
                className="inline-flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Template</span>
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedTemplates).map(([groupId, groupData]) => {
            const isExpanded = expandedGroups[groupId] !== false;
            let groupTitle = "";
            let groupCount = 0;
            let groupTemplates = [];

            // Determine group type and extract data
            if (viewMode === "current" || viewMode === "class") {
              groupTitle = groupData.classInfo?.class_name || "Unknown Class";
              groupCount = groupData.templates.length;
              groupTemplates = groupData.templates;
            } else if (viewMode === "year") {
              groupTitle = groupData.yearInfo?.year_label || "Unknown Year";
              if (groupData.yearInfo?.is_current) {
                groupTitle += " (Current)";
              }
              groupCount = groupData.templates.length;
              groupTemplates = groupData.templates;
            } else {
              // viewMode === "all"
              const classId = groupId;
              const className =
                groupData.classInfo?.class_name || "Unknown Class";

              return (
                <div
                  key={classId}
                  className="bg-white rounded-lg shadow border"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(classId)}
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      )}
                      <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {className}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {Object.keys(groupData.yearGroups).length} academic
                          year(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {Object.entries(groupData.yearGroups).map(
                        ([yearId, yearData]) => {
                          const yearGroupId = `${classId}-${yearId}`;
                          const isYearExpanded =
                            expandedGroups[yearGroupId] !== false;
                          const yearTotals = calculateFeeTotals(
                            yearData.templates
                          );
                          const isCurrentYear = yearData.yearInfo?.is_current;

                          return (
                            <div
                              key={yearId}
                              className="border-b border-gray-100 last:border-b-0"
                            >
                              <div
                                className={`flex items-center justify-between p-4 cursor-pointer ${
                                  isCurrentYear
                                    ? "bg-blue-50 hover:bg-blue-100"
                                    : "bg-gray-50 hover:bg-gray-100"
                                }`}
                                onClick={() => toggleGroup(yearGroupId)}
                              >
                                <div className="flex items-center space-x-3">
                                  {isYearExpanded ? (
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {yearData.yearInfo?.year_label ||
                                        "Unknown Year"}
                                      {isCurrentYear && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                          Current
                                        </span>
                                      )}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {yearData.templates.length} template(s) •
                                      Due by{" "}
                                      {new Date(
                                        Math.max(
                                          ...yearData.templates.map((t) =>
                                            new Date(t.due_date).getTime()
                                          )
                                        )
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {isYearExpanded && (
                                <div className="bg-white">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Term & Fee Details
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount & Due Date
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                          </th>
                                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {yearData.templates.map((template) => (
                                          <tr
                                            key={template.id}
                                            className="hover:bg-gray-50"
                                          >
                                            <td className="px-6 py-4">
                                              <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                  {getTermName(
                                                    template.term_id
                                                  )}{" "}
                                                  -{" "}
                                                  {getFeeCategoryName(
                                                    template.fee_category_id
                                                  )}
                                                </div>
                                                {template.description && (
                                                  <div className="text-sm text-gray-500 mt-1">
                                                    {template.description}
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                              <div className="flex items-center">
                                                <BanknotesIcon className="w-4 h-4 text-green-500 mr-1" />
                                                <span className="text-sm font-medium text-gray-900">
                                                  Ghc{" "}
                                                  {parseFloat(
                                                    template.amount
                                                  ).toFixed(2)}
                                                </span>
                                              </div>
                                              <div className="flex items-center mt-1">
                                                <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                                                <span className="text-sm text-gray-500">
                                                  Due:{" "}
                                                  {new Date(
                                                    template.due_date
                                                  ).toLocaleDateString()}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                              <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                  template.is_compulsory
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-blue-100 text-blue-800"
                                                }`}
                                              >
                                                {template.is_compulsory
                                                  ? "Compulsory"
                                                  : "Optional"}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                              <div className="flex justify-end space-x-2">
                                                <button
                                                  onClick={() =>
                                                    handleEdit(template)
                                                  }
                                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                                >
                                                  <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    handleDelete(template)
                                                  }
                                                  className="text-red-600 hover:text-red-900 transition-colors"
                                                >
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // For simpler views (current, class, year)
            const groupTotals = calculateFeeTotals(groupTemplates);
            const isCurrentYearGroup =
              viewMode === "year" && groupData.yearInfo?.is_current;

            return (
              <div key={groupId} className="bg-white rounded-lg shadow border">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer ${
                    isCurrentYearGroup
                      ? "bg-blue-50 hover:bg-blue-100"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleGroup(groupId)}
                >
                  <div className="flex items-center space-x-3">
                    {isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                    {viewMode === "year" ? (
                      <CalendarIcon className="w-8 h-8 text-gray-600" />
                    ) : (
                      <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {groupTitle}
                        {isCurrentYearGroup && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Current Year
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {groupCount} template(s) • Due by{" "}
                        {new Date(
                          Math.max(
                            ...groupTemplates.map((t) =>
                              new Date(t.due_date).getTime()
                            )
                          )
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        Ghc {groupTotals.compulsory.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Compulsory</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        Ghc {groupTotals.optional.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Optional</div>
                    </div>
                    <div className="text-right border-l pl-4">
                      <div className="text-lg font-bold text-green-600">
                        Ghc {groupTotals.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount & Due
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type & Term
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {groupTemplates.map((template) => (
                            <tr key={template.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {viewMode === "year"
                                      ? getClassName(template.class_id)
                                      : viewMode === "current"
                                      ? getTermName(template.term_id)
                                      : getYearLabel(template.academic_year_id)}
                                    {" - "}
                                    {getFeeCategoryName(
                                      template.fee_category_id
                                    )}
                                  </div>
                                  {template.description && (
                                    <div className="text-sm text-gray-500 mt-1">
                                      {template.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <BanknotesIcon className="w-4 h-4 text-green-500 mr-1" />
                                  <span className="text-sm font-medium text-gray-900">
                                    Ghc {parseFloat(template.amount).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="text-sm text-gray-500">
                                    Due:{" "}
                                    {new Date(
                                      template.due_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <span
                                    className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      template.is_compulsory
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {template.is_compulsory
                                      ? "Compulsory"
                                      : "Optional"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {viewMode === "current"
                                      ? getYearLabel(template.academic_year_id)
                                      : viewMode === "class"
                                      ? getTermName(template.term_id)
                                      : getTermName(template.term_id)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(template)}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(template)}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal with Persistent Selections */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTemplate
                    ? "Edit Bill Template"
                    : "Create Bill Template"}
                </h2>
                {!editingTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      // Reset only the amount, due date, and description
                      setFormData({
                        ...formData,
                        amount: "",
                        due_date: "",
                        description: "",
                        is_compulsory: true,
                      });
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear New Template
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Class - Auto-select current selection if editing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class *
                      <span className="text-xs text-gray-500 ml-2">
                        {selectedClassId !== "all" && !editingTemplate && (
                          <span className="text-emerald-600">
                            (Filtered: {getClassName(selectedClassId)})
                          </span>
                        )}
                      </span>
                    </label>
                    <select
                      required
                      value={formData.class_id}
                      onChange={(e) =>
                        setFormData({ ...formData, class_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Class</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.class_name}
                          {selectedClassId === classItem.id.toString() &&
                            !editingTemplate &&
                            " ✓"}
                        </option>
                      ))}
                    </select>
                    {selectedClassId !== "all" && !editingTemplate && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            class_id: selectedClassId,
                          })
                        }
                        className="mt-1 text-xs text-emerald-600 hover:text-emerald-800"
                      >
                        Use filtered class
                      </button>
                    )}
                  </div>

                  {/* Academic Year - Auto-select from context */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year *
                      <span className="text-xs text-gray-500 ml-2">
                        {!editingTemplate && (
                          <span className="text-emerald-600">
                            (From context)
                          </span>
                        )}
                      </span>
                    </label>
                    <select
                      required
                      value={formData.academic_year_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academic_year_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Year</option>
                      {academicYears.map((year) => (
                        <option
                          key={year.id}
                          value={year.id}
                          className={
                            year.is_current
                              ? "font-semibold text-emerald-600"
                              : ""
                          }
                        >
                          {year.year_label}
                          {year.is_current && " (Current)"}
                          {selectedAcademicYear === year.id.toString() &&
                            !editingTemplate &&
                            " ✓"}
                        </option>
                      ))}
                    </select>
                    {!editingTemplate && selectedAcademicYear && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            academic_year_id: selectedAcademicYear,
                          })
                        }
                        className="mt-1 text-xs text-emerald-600 hover:text-emerald-800"
                      >
                        Use current year from context
                      </button>
                    )}
                  </div>

                  {/* Term - Auto-select from context */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Term *
                      <span className="text-xs text-gray-500 ml-2">
                        {!editingTemplate && (
                          <span className="text-emerald-600">
                            (From context)
                          </span>
                        )}
                      </span>
                    </label>
                    <select
                      required
                      value={formData.term_id}
                      onChange={(e) =>
                        setFormData({ ...formData, term_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Term</option>
                      {terms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.term_name}
                          {selectedTerm === term.id.toString() &&
                            !editingTemplate &&
                            " ✓"}
                        </option>
                      ))}
                    </select>
                    {!editingTemplate && selectedTerm && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, term_id: selectedTerm })
                        }
                        className="mt-1 text-xs text-emerald-600 hover:text-emerald-800"
                      >
                        Use current term from context
                      </button>
                    )}
                  </div>

                  {/* Fee Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fee Category *
                    </label>
                    <select
                      required
                      value={formData.fee_category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fee_category_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Category</option>
                      {feeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (Ghc) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Compulsory Option */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_compulsory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_compulsory: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      This is a compulsory fee (students must pay this)
                    </span>
                  </label>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Additional details about this fee..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
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
                        : editingTemplate
                        ? "Update Template"
                        : "Create Template"}
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

export default BillTemplates;