import { useAuth } from "../contexts/AuthContext";
import {
  UserCircleIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Get user role
  const userRole = (user.role || user.role_name || "").toLowerCase();

  // Get welcome message based on role
  const getWelcomeMessage = () => {
    const name = user?.first_name || user?.username || "Valued User";
    const time = new Date().getHours();
    const greeting =
      time < 12
        ? "Good Morning"
        : time < 18
        ? "Good Afternoon"
        : "Good Evening";

    const roleMessages = {
      admin: `${greeting}, ${name}! Welcome to the Administrator Dashboard. You have full system control and management capabilities.`,
      teacher: `${greeting}, ${name}! Welcome to your Teacher Portal. Manage your classes, students, and academic activities.`,
      student: `${greeting}, ${name}! Welcome to your Student Portal. Access your academic records, fees, and personal information.`,
      accountant: `${greeting}, ${name}! Welcome to the Finance Dashboard. Manage financial transactions, fees, and reports.`,
      parent: `${greeting}, ${name}! Welcome to the Parent Portal. Monitor your child's progress and school activities.`,
    };

    return (
      roleMessages[userRole] ||
      `${greeting}, ${name}! Welcome to School Management System.`
    );
  };

  // Get role-specific quick actions
  const getQuickActions = () => {
    const actions = {
      admin: [
        {
          label: "Manage Users",
          icon: UserCircleIcon,
          path: "/accounts",
          color: "bg-red-100 text-red-600",
        },
        {
          label: "System Settings",
          icon: Cog6ToothIcon,
          path: "/school-settings",
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "View Reports",
          icon: ChartBarIcon,
          path: "/finance/reports",
          color: "bg-green-100 text-green-600",
        },
        {
          label: "Academic Calendar",
          icon: CalendarDaysIcon,
          path: "/year-term-settings",
          color: "bg-purple-100 text-purple-600",
        },
      ],
      teacher: [
        {
          label: "Take Attendance",
          icon: UserCircleIcon,
          path: "/academics/attendance/take",
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "Enter Grades",
          icon: AcademicCapIcon,
          path: "/academics/grades",
          color: "bg-green-100 text-green-600",
        },
        {
          label: "My Classes",
          icon: CalendarDaysIcon,
          path: "/classes/list",
          color: "bg-purple-100 text-purple-600",
        },
        {
          label: "Generate Reports",
          icon: ChartBarIcon,
          path: "/academics/report-cards/generate",
          color: "bg-amber-100 text-amber-600",
        },
      ],
      student: [
        {
          label: "View Report Cards",
          icon: AcademicCapIcon,
          path: "/academics/report-cards",
          color: "bg-green-100 text-green-600",
        },
        {
          label: "Attendance Record",
          icon: CalendarDaysIcon,
          path: "/academics/attendance",
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "Fee Statement",
          icon: BanknotesIcon,
          path: "/finance/student-bills",
          color: "bg-purple-100 text-purple-600",
        },
        {
          label: "My Profile",
          icon: UserCircleIcon,
          path: "/profile",
          color: "bg-amber-100 text-amber-600",
        },
      ],
      accountant: [
        {
          label: "Receive Payments",
          icon: BanknotesIcon,
          path: "/finance/receive-payment",
          color: "bg-green-100 text-green-600",
        },
        {
          label: "Fee Categories",
          icon: ChartBarIcon,
          path: "/finance/fee-categories",
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "Financial Reports",
          icon: ChartBarIcon,
          path: "/finance/reports",
          color: "bg-purple-100 text-purple-600",
        },
        {
          label: "Manage Expenses",
          icon: BanknotesIcon,
          path: "/expenses",
          color: "bg-red-100 text-red-600",
        },
      ],
    };

    return (
      actions[userRole] || [
        {
          label: "View Profile",
          icon: UserCircleIcon,
          path: "/profile",
          color: "bg-gray-100 text-gray-600",
        },
        {
          label: "Contact Support",
          icon: EnvelopeIcon,
          path: "#",
          color: "bg-gray-100 text-gray-600",
        },
      ]
    );
  };

  // Get role icon and color
  const getRoleInfo = () => {
    const roleInfo = {
      admin: {
        icon: ShieldCheckIcon,
        color: "bg-red-100 text-red-800",
        label: "Administrator",
      },
      teacher: {
        icon: AcademicCapIcon,
        color: "bg-blue-100 text-blue-800",
        label: "Teacher",
      },
      student: {
        icon: UserCircleIcon,
        color: "bg-green-100 text-green-800",
        label: "Student",
      },
      accountant: {
        icon: BanknotesIcon,
        color: "bg-purple-100 text-purple-800",
        label: "Accountant",
      },
    };

    return (
      roleInfo[userRole] || {
        icon: UserCircleIcon,
        color: "bg-gray-100 text-gray-800",
        label: userRole,
      }
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getWelcomeMessage()}</h1>
            <p className="text-emerald-100 opacity-90">
              Last login:{" "}
              {formatDate(user?.last_login || new Date().toISOString())}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${roleInfo.color}`}
            >
              <RoleIcon className="w-5 h-5 mr-2" />
              {roleInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getQuickActions().map((action, index) => {
                const Icon = action.icon;
                return (
                  <a
                    key={index}
                    href={action.path}
                    className="flex flex-col items-center p-4 border rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${action.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-gray-900 text-center group-hover:text-emerald-600">
                      {action.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <UserCircleIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Basic Details
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Full Name
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Username
                    </dt>
                    <dd className="mt-1 text-gray-900">@{user?.username}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      User ID
                    </dt>
                    <dd className="mt-1 text-gray-900">#{user?.id}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Contact Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Email Address
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {user?.email || "Not provided"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Account Created
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {formatDate(user?.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Account Status
                    </dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Summary */}
        <div className="space-y-6">
          {/* Role Summary */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Role Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${roleInfo.color}`}
                >
                  <RoleIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {userRole} Account
                  </p>
                  <p className="text-sm text-gray-600">
                    {userRole === "admin" &&
                      "Full system access and management"}
                    {userRole === "teacher" &&
                      "Teaching staff with class management"}
                    {userRole === "student" &&
                      "Student access to academic records"}
                    {userRole === "accountant" &&
                      "Financial management and reporting"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium text-gray-700 mb-2">Permissions</h3>
                <ul className="space-y-2 text-sm">
                  {userRole === "admin" && (
                    <>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        User Management
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        System Configuration
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Financial Oversight
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Academic Management
                      </li>
                    </>
                  )}
                  {userRole === "teacher" && (
                    <>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Class Management
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Grade Entry
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Attendance Tracking
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Student Reports
                      </li>
                    </>
                  )}
                  {userRole === "student" && (
                    <>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        View Grades
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Check Attendance
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        View Fee Statements
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Update Profile
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Days Active</p>
                  <p className="text-2xl font-bold text-gray-900">--</p>
                </div>
                <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Completion</p>
                  <p className="text-2xl font-bold text-gray-900">--%</p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-gray-400" />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Need help? Contact the administration for support with your
                  account.
                </p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Platform Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Last Updated</span>
                <span className="text-gray-900">
                  {formatDate(new Date().toISOString())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Version</span>
                <span className="text-gray-900">v2.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
            <p className="text-gray-700">You logged in successfully</p>
            <span className="ml-auto text-sm text-gray-500">Just now</span>
          </div>
          <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <p className="text-gray-700">Profile viewed</p>
            <span className="ml-auto text-sm text-gray-500">Today</span>
          </div>
          <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
            <p className="text-gray-700">System updated to latest version</p>
            <span className="ml-auto text-sm text-gray-500">This week</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
