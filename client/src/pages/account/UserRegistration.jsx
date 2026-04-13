import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  KeyIcon,
  TrashIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Modal from "../../components/common/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import axios from "axios";
import api from "../../components/axiosconfig/axiosConfig";

const UserRegistration = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  

  // Form state
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role_id: "",
    first_name: "",
    last_name: "",
    is_active: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isDefaultPasswordModalOpen, setIsDefaultPasswordModalOpen] =
    useState(false);
  const [defaultPasswordForm, setDefaultPasswordForm] = useState({
    defaultPassword: "",
    confirmDefaultPassword: "",
  });

  const [showDefaultPassword, setShowDefaultPassword] = useState(false);
  const [showConfirmDefaultPassword, setShowConfirmDefaultPassword] =
    useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/getusers");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/getroles");
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name &&
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name &&
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.role_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && user.is_active) ||
      (activeTab === "inactive" && !user.is_active) ||
      (activeTab === "admin" && user.role_name === "Admin") ||
      (activeTab === "teacher" && user.role_name === "Teacher");

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admin: users.filter((u) => u.role_name === "admin").length,
    teacher: users.filter((u) => u.role_name === "teacher").length,
    teacher: users.filter((u) => u.role_name === "accountant").length,
    inactive: users.filter((u) => !u.is_active).length,
  };

  const handleAddUser = () => {
    setUserForm({
      username: "",
      email: "",
      password: "",
      role_id: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      is_active: true,
    });
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setUserForm({
      username: user.username,
      email: user.email,
      password: "",
      role_id: user.role_id || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      is_active: user.is_active,
    });
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSetDefaultPassword = async (e) => {
    e.preventDefault();

    if (
      defaultPasswordForm.defaultPassword !==
      defaultPasswordForm.confirmDefaultPassword
    ) {
      alert("Passwords do not match");
      return;
    }

    if (defaultPasswordForm.defaultPassword.length < 6) {
      alert("Default password must be at least 6 characters");
      return;
    }

    try {
      await api.post("/setdefaultpassword", {
        defaultPassword: defaultPasswordForm.defaultPassword,
      });

      setIsDefaultPasswordModalOpen(false);
      alert("Default password updated successfully");

      setDefaultPasswordForm({
        defaultPassword: "",
        confirmDefaultPassword: "",
      });
    } catch (error) {
      console.error("Error setting default password:", error);
      alert(error.response?.data?.error || "Failed to set default password");
    }
  };

  const handleChangePassword = (userId) => {
    setSelectedUserId(userId);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsPasswordModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await api.delete(`/deleteuser/${userId}`);
      fetchUsers();
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update existing user
        await api.put(
          `/updateuser/${editingUser.id}`,
          userForm
        );
        setIsModalOpen(false);
        fetchUsers();
        alert("User updated successfully");
      } else {
        // Create new user
        await api.post("/createuser", userForm);
        setIsModalOpen(false);
        fetchUsers();
        alert("User created successfully");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert(error.response?.data?.error || "Failed to save user");
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      // Use the new endpoint for default password change
      await api.post("/changepasswordwithdefault", {
        id: selectedUserId,
        defaultPassword: passwordForm.currentPassword, // This is the default password
        newPassword: passwordForm.newPassword,
      });

      setIsPasswordModalOpen(false);
      alert("Password changed successfully");

      // Clear form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      alert(error.response?.data?.error || "Failed to change password");
    }
  };

  const getRoleColor = (roleName) => {
    const colors = {
      Admin: "bg-purple-500/10 text-purple-700 border-purple-200",
      Teacher: "bg-blue-500/10 text-blue-700 border-blue-200",
      Accountant: "bg-green-500/10 text-green-700 border-green-200",
      Registrar: "bg-amber-500/10 text-amber-700 border-amber-200",
    };
    return colors[roleName] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage system users, roles, and permissions
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsDefaultPasswordModalOpen(true)}
                className="group flex items-center space-x-2 bg-amber-50 text-amber-700 px-5 py-3 rounded-xl hover:bg-amber-100 transition-all duration-300 border border-amber-200 shadow-sm hover:shadow-md"
              >
                <KeyIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Default Password</span>
              </button>

              <button
                onClick={handleAddUser}
                className="group flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <UserPlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Add New User</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.active}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admin Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.admin}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Teacher Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.teacher}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.inactive}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/50 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All Users", count: users.length },
                  { id: "active", label: "Active", count: stats.active },
                  { id: "inactive", label: "Inactive", count: stats.inactive },
                  { id: "admin", label: "Admins", count: stats.admin },
                  { id: "teacher", label: "Teachers", count: stats.teacher },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === tab.id ? "bg-white/20" : "bg-gray-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <UserCircleIcon className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium mb-2">
                          No users found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or create a new user
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                              user.role_name === "Admin"
                                ? "bg-purple-100"
                                : user.role_name === "Teacher"
                                  ? "bg-blue-100"
                                  : "bg-emerald-100"
                            }`}
                          >
                            <span
                              className={`text-lg font-bold ${
                                user.role_name === "Admin"
                                  ? "text-purple-600"
                                  : user.role_name === "Teacher"
                                    ? "text-blue-600"
                                    : "text-emerald-600"
                              }`}
                            >
                              {user.first_name?.[0]}
                              {user.last_name?.[0] || user.username[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.username}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                              user.role_name,
                            )}`}
                          >
                            {user.role_name}
                          </span>
                          <div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                user.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {user.email}
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center text-sm text-gray-600">
                              <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                              {user.phone_number}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors group/edit"
                          >
                            <PencilIcon className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Edit</span>
                          </button>

                          <button
                            onClick={() => handleChangePassword(user.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors group/pass"
                          >
                            <KeyIcon className="w-4 h-4 group-hover/pass:scale-110 transition-transform" />
                            <span className="text-sm font-medium">
                              Password
                            </span>
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors group/delete"
                          >
                            <TrashIcon className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit User Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  editingUser ? "bg-blue-100" : "bg-emerald-100"
                }`}
              >
                {editingUser ? (
                  <PencilIcon className="w-5 h-5 text-blue-600" />
                ) : (
                  <UserPlusIcon className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser ? "Edit User" : "Create New User"}
                </h3>
                <p className="text-sm text-gray-600">
                  {editingUser
                    ? "Update user information"
                    : "Add a new user to the system"}
                </p>
              </div>
            </div>
          }
          size="large"
        >
          <form onSubmit={handleSaveUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Username
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Role
                </label>
                <select
                  value={userForm.role_id}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Email Address
              </label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="user@school.edu"
                required
              />
            </div>

            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12"
                    placeholder="Enter password"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 6 characters long
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={userForm.first_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, first_name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={userForm.last_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, last_name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                checked={userForm.is_active}
                onChange={(e) =>
                  setUserForm({ ...userForm, is_active: e.target.checked })
                }
                className="w-5 h-5 text-emerald-500 bg-white border-gray-300 rounded focus:ring-emerald-500"
              />
              <div className="ml-3">
                <label className="font-medium text-gray-900">
                  Active Account
                </label>
                <p className="text-sm text-gray-600">
                  User can log in and access the system
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPasswordForm({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmNewPassword(false);
          }}
          title={
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <KeyIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Change User Password
                </h3>
                <p className="text-sm text-gray-600">
                  Reset password using system default
                </p>
              </div>
            </div>
          }
          size="medium"
        >
          <form onSubmit={handleSavePassword} className="space-y-6">
            {/* Info box about default password */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Using Default Password
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Enter the system default password in the "Current Password"
                    field, then set a new password for this user.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Password (Default Password) field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Current Password
                (Default)
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12"
                  placeholder="Enter system default password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              
            </div>

            {/* New Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12"
                  placeholder="Enter new password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmNewPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmNewPassword(!showConfirmNewPassword)
                  }
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {passwordForm.newPassword && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Password strength:
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      passwordForm.newPassword.length < 6
                        ? "text-red-600"
                        : passwordForm.newPassword.length < 8
                          ? "text-yellow-600"
                          : /[A-Z]/.test(passwordForm.newPassword) &&
                              /[0-9]/.test(passwordForm.newPassword) &&
                              /[^A-Za-z0-9]/.test(passwordForm.newPassword)
                            ? "text-green-600"
                            : "text-blue-600"
                    }`}
                  >
                    {passwordForm.newPassword.length < 6
                      ? "Too short"
                      : passwordForm.newPassword.length < 8
                        ? "Weak"
                        : /[A-Z]/.test(passwordForm.newPassword) &&
                            /[0-9]/.test(passwordForm.newPassword) &&
                            /[^A-Za-z0-9]/.test(passwordForm.newPassword)
                          ? "Strong"
                          : "Good"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordForm.newPassword.length < 6
                        ? "w-1/4 bg-red-500"
                        : passwordForm.newPassword.length < 8
                          ? "w-2/4 bg-yellow-500"
                          : /[A-Z]/.test(passwordForm.newPassword) &&
                              /[0-9]/.test(passwordForm.newPassword) &&
                              /[^A-Za-z0-9]/.test(passwordForm.newPassword)
                            ? "w-full bg-green-500"
                            : "w-3/4 bg-blue-500"
                    }`}
                  />
                </div>

                {/* Password requirements checklist */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center space-x-2">
                    {passwordForm.newPassword.length >= 6 ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-xs text-gray-600">
                      Min 6 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/[A-Z]/.test(passwordForm.newPassword) ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-xs text-gray-600">
                      Uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/[a-z]/.test(passwordForm.newPassword) ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-xs text-gray-600">
                      Lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/[0-9]/.test(passwordForm.newPassword) ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-gray-300" />
                    )}
                    <span className="text-xs text-gray-600">Number</span>
                  </div>
                </div>
              </div>
            )}

            {/* Password match indicator */}
            {passwordForm.confirmPassword && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  passwordForm.newPassword === passwordForm.confirmPassword
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmNewPassword(false);
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword ||
                  passwordForm.newPassword.length < 6
                }
                className={`px-6 py-3 rounded-xl font-medium shadow-md transition-all ${
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword ||
                  passwordForm.newPassword.length < 6
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg"
                }`}
              >
                Change Password
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isDefaultPasswordModalOpen}
          onClose={() => {
            setIsDefaultPasswordModalOpen(false);
            setDefaultPasswordForm({
              defaultPassword: "",
              confirmDefaultPassword: "",
            });
            setShowDefaultPassword(false);
            setShowConfirmDefaultPassword(false);
          }}
          title={
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <KeyIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Set Default Password
                </h3>
                <p className="text-sm text-gray-600">
                  Configure system-wide default password
                </p>
              </div>
            </div>
          }
          size="medium"
        >
          <form onSubmit={handleSetDefaultPassword} className="space-y-6">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Important Security Notice
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    This password will be used when resetting user accounts.
                    Share it only with authorized personnel. Consider using a
                    strong password with letters, numbers, and special
                    characters.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Default Password
              </label>
              <div className="relative">
                <input
                  type={showDefaultPassword ? "text" : "password"}
                  value={defaultPasswordForm.defaultPassword}
                  onChange={(e) =>
                    setDefaultPasswordForm({
                      ...defaultPasswordForm,
                      defaultPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12"
                  placeholder="Enter default password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowDefaultPassword(!showDefaultPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showDefaultPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Minimum 6 characters. Use a mix of letters, numbers, and symbols
                for better security.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Confirm Default Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmDefaultPassword ? "text" : "password"}
                  value={defaultPasswordForm.confirmDefaultPassword}
                  onChange={(e) =>
                    setDefaultPasswordForm({
                      ...defaultPasswordForm,
                      confirmDefaultPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all pr-12"
                  placeholder="Confirm default password"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmDefaultPassword(!showConfirmDefaultPassword)
                  }
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmDefaultPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength indicator (optional but nice) */}
            {defaultPasswordForm.defaultPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Password strength:
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      defaultPasswordForm.defaultPassword.length < 6
                        ? "text-red-600"
                        : defaultPasswordForm.defaultPassword.length < 8
                          ? "text-yellow-600"
                          : defaultPasswordForm.defaultPassword.length < 10
                            ? "text-blue-600"
                            : "text-green-600"
                    }`}
                  >
                    {defaultPasswordForm.defaultPassword.length < 6
                      ? "Too short"
                      : defaultPasswordForm.defaultPassword.length < 8
                        ? "Weak"
                        : defaultPasswordForm.defaultPassword.length < 10
                          ? "Good"
                          : "Strong"}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      defaultPasswordForm.defaultPassword.length < 6
                        ? "w-1/4 bg-red-500"
                        : defaultPasswordForm.defaultPassword.length < 8
                          ? "w-2/4 bg-yellow-500"
                          : defaultPasswordForm.defaultPassword.length < 10
                            ? "w-3/4 bg-blue-500"
                            : "w-full bg-green-500"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Password match indicator */}
            {defaultPasswordForm.confirmDefaultPassword && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  defaultPasswordForm.defaultPassword ===
                  defaultPasswordForm.confirmDefaultPassword
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {defaultPasswordForm.defaultPassword ===
                  defaultPasswordForm.confirmDefaultPassword ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsDefaultPasswordModalOpen(false);
                  setDefaultPasswordForm({
                    defaultPassword: "",
                    confirmDefaultPassword: "",
                  });
                  setShowDefaultPassword(false);
                  setShowConfirmDefaultPassword(false);
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !defaultPasswordForm.defaultPassword ||
                  !defaultPasswordForm.confirmDefaultPassword ||
                  defaultPasswordForm.defaultPassword !==
                    defaultPasswordForm.confirmDefaultPassword ||
                  defaultPasswordForm.defaultPassword.length < 6
                }
                className={`px-6 py-3 rounded-xl font-medium shadow-md transition-all ${
                  !defaultPasswordForm.defaultPassword ||
                  !defaultPasswordForm.confirmDefaultPassword ||
                  defaultPasswordForm.defaultPassword !==
                    defaultPasswordForm.confirmDefaultPassword ||
                  defaultPasswordForm.defaultPassword.length < 6
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg"
                }`}
              >
                Save Default Password
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default UserRegistration;
