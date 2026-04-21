import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  XMarkIcon,
  Bars3Icon,
  DocumentTextIcon,
  BookOpenIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ReceiptRefundIcon,
  DocumentChartBarIcon,
  BuildingLibraryIcon,
  BookmarkSquareIcon,
  ClipboardDocumentListIcon,
  QueueListIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  BookmarkIcon,
  PlusCircleIcon,
  ChartPieIcon,
  ArrowLeftEndOnRectangleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../pages/contexts/AuthContext";

const Sidebar = () => {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarExpanded") !== "false";
    }
    return true;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      icon: HomeIcon,
      path: "/dashboard",
      // notification: 3,
      roles: ["admin"],
    },
    {
      name: "Students",
      icon: UsersIcon,
      path: "/students-lists",
      roles: ["admin"],
    },
    {
      name: "Teachers",
      icon: AcademicCapIcon,
      path: "/teachers/list",
      roles: ["admin"],
    },
    {
      name: "Classes",
      icon: BuildingLibraryIcon,
      subItems: [
        {
          name: "Class List",
          path: "/classes/list",
          icon: ClipboardDocumentListIcon,
          roles: ["admin", "teacher"],
        },
        {
          name: "Class Assignments",
          path: "/classes/assignments",
          icon: UsersIcon,
          roles: ["admin"],
        },
        {
          name: "Class Teachers",
          path: "/classes/teachers",
          icon: AcademicCapIcon,
          roles: ["admin"],
        },
      ],
      roles: ["admin"],
    },
    {
      name: "Subjects",
      icon: BookmarkSquareIcon,
      subItems: [
        {
          name: "Subject List",
          path: "/subjects/list",
          icon: QueueListIcon,
          roles: ["admin"],
        },

        {
          name: "Subject Assignments",
          path: "/subjects-assignments",
          icon: BookOpenIcon,
          roles: ["admin"],
        },
      ],
      roles: ["admin"],
    },

    {
      name: "Attendance",
      icon: CalendarDaysIcon,
      subItems: [
        {
          name: "Attendance",
          path: "/academics/attendance",
          icon: CalendarDaysIcon,
          roles: ["admin", "teacher"],
        },
        {
          name: "Reports & Analytics",
          path: "/academics/attendance/reports",
          icon: ChartBarIcon,
          roles: ["admin", "teacher"],
        },
      ],
      roles: ["admin", "teacher"],
    },
    {
      name: "Academics",
      icon: BookOpenIcon,
      subItems: [
        {
          name: "Scores",
          path: "/academics/grades",
          icon: DocumentTextIcon,
          roles: ["admin", "teacher"],
        },
        {
          name: "Report Cards",
          path: "/academics/report-cards",
          icon: BookmarkIcon,
          roles: ["admin", "teacher", "student"],
        },
        {
          name: "Grade Scales",
          icon: CalendarIcon,
          path: "/academics/grading-scales",
          roles: ["admin"],
        },
        {
          name: "Approve Scores",
          icon: AcademicCapIcon,
          path: "/academics/report-cards/generate",
          roles: ["admin"],
        },
      ],
      roles: ["admin", "teacher", "student"],
    },

    {
      name: "Finance",
      icon: BanknotesIcon,
      subItems: [
        {
          name: "Arrears Management",
          path: "/finance/arrears",
          icon: ExclamationTriangleIcon,
          roles: ["admin", "accountant"],
        },
        {
          name: "Fee Categories",
          path: "/finance/fee-categories",
          icon: ClipboardDocumentListIcon,
          roles: ["admin", "accountant"],
        },
        {
          name: "Class Bills",
          path: "/finance/classbills",
          icon: DocumentChartBarIcon,
          roles: ["admin", "accountant"],
        },
        {
          name: "Student Bills",
          path: "/finance/student-bills",
          icon: DocumentTextIcon,
          roles: ["admin", "accountant"],
        },
        {
          name: "Fee Payments",
          path: "/finance/receive-payment",
          icon: BanknotesIcon,
          roles: ["admin", "accountant"],
        },
        {
          name: "Receipts",
          path: "/finance/receipts-management",
          icon: ReceiptRefundIcon,
          roles: ["admin", "accountant"],
        },
        {
          name: "Daily Payments",
          path: "/daily-payments",
          icon: GiftIcon,
          roles: ["admin", "accountant"],
        },
        {
          name: "Financial Reports",
          path: "/finance/reports",
          icon: ChartBarIcon,
          roles: ["admin", "accountant"],
        },
      ],
      roles: ["admin", "accountant"],
    },
    {
      name: "Expenses",
      icon: ExclamationTriangleIcon,
      path: "/expenses",
      roles: ["admin", "accountant"],
    },

    {
      name: "Pay Roll",
      icon: PlusCircleIcon,
      path: "/payroll-dashboard",
      roles: ["admin", "accountant"],
    },
    {
      name: "Profit & Loss",
      icon: ChartPieIcon,
      path: "/profit-loss",
      roles: ["admin", "accountant"],
    },

    {
      name: "Settings",
      icon: Cog6ToothIcon,
      subItems: [
        {
          name: "Year Term Settings",
          icon: CalendarIcon,
          path: "/year-term-settings",
          roles: ["admin", "accountant"],
        },

        {
          name: "School Settings",
          icon: Cog6ToothIcon,
          path: "/school-settings",
          roles: ["admin"],
        },
      ],
      roles: ["admin", "accountant"],
    },
    {
      name: "User Accounts",
      icon: UserCircleIcon,
      path: "/accounts",
      roles: ["admin"],
    },
    {
      name: "User Logs",
      icon: ArrowLeftEndOnRectangleIcon,
      path: "/activity-logs",
      roles: ["admin"],
    },
    {
      name: "Email Logs",
      icon: EnvelopeIcon,
      path: "/email-logs",
      roles: ["admin", "accountant"],
    },
  ];

  const toggleSidebar = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem("sidebarExpanded", newState.toString());
  };

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const toggleSubmenu = (name) => {
    setActiveSubmenu(activeSubmenu === name ? null : name);
  };

  const filteredItems = navItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subItems &&
        item.subItems.some((sub) =>
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )),
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleMobile}
      />

      {/* Sidebar - MODERN COLOR SCHEME */}
      <aside
        className={`
        fixed md:relative z-40 h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white
        transition-all duration-300 ease-in-out overflow-hidden
        flex flex-col
        ${expanded ? "w-64" : "w-20"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {expanded ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold whitespace-nowrap">
                School Manager
              </h1>
            </div>
          ) : (
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full hover:bg-slate-700 transition-colors"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Search */}
        {expanded && (
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 placeholder-slate-400"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-2">
            {filteredItems.map(
              (item) =>
                item.roles.includes(user?.role_name) && (
                  <li key={item.name}>
                    {item.subItems ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`
                          flex items-center justify-between w-full p-3 rounded-lg
                          hover:bg-slate-700 transition-colors
                          ${activeSubmenu === item.name ? "bg-slate-700" : ""}
                          ${
                            location.pathname.startsWith(
                              `/${item.name.toLowerCase()}`,
                            )
                              ? "bg-emerald-500 text-white font-semibold"
                              : ""
                          }
                        `}
                        >
                          <div className="flex items-center">
                            <item.icon
                              className={`w-5 h-5 ${
                                expanded ? "mr-3" : "mx-auto"
                              }`}
                            />
                            {expanded && <span>{item.name}</span>}
                          </div>
                          {expanded && (
                            <ChevronRightIcon
                              className={`w-4 h-4 transition-transform ${
                                activeSubmenu === item.name ? "rotate-90" : ""
                              }`}
                            />
                          )}
                        </button>

                        {/* Sub-items */}
                        {expanded && activeSubmenu === item.name && (
                          <ul className="ml-6 mt-1 space-y-1 border-l-2 border-slate-600">
                            {item.subItems.map(
                              (subItem) =>
                                subItem.roles.includes(user?.role_name) && (
                                  <li key={subItem.name}>
                                    <button
                                      onClick={() => {
                                        navigate(subItem.path);
                                        setMobileOpen(false);
                                      }}
                                      className={`
                                    flex items-center p-2 text-sm rounded ml-3 w-full text-left
                                    hover:bg-slate-700 transition-colors
                                    ${
                                      location.pathname === subItem.path
                                        ? "bg-emerald-500 text-white font-medium"
                                        : "text-slate-300"
                                    }
                                  `}
                                    >
                                      <subItem.icon className="w-4 h-4 mr-2" />
                                      {subItem.name}
                                    </button>
                                  </li>
                                ),
                            )}
                          </ul>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          navigate(item.path);
                          setMobileOpen(false);
                        }}
                        className={`
                        flex items-center justify-between w-full p-3 rounded-lg
                        hover:bg-slate-700 transition-colors
                        ${
                          location.pathname === item.path
                            ? "bg-emerald-500 text-white font-semibold"
                            : ""
                        }
                      `}
                      >
                        <div className="flex items-center">
                          <item.icon
                            className={`w-5 h-5 ${
                              expanded ? "mr-3" : "mx-auto"
                            }`}
                          />
                          {expanded && <span>{item.name}</span>}
                        </div>
                        {expanded && item.notification && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.notification}
                          </span>
                        )}
                      </button>
                    )}
                  </li>
                ),
            )}
          </ul>
        </nav>

        {/* User Profile */}
        <div
          className={`
          p-4 border-t border-slate-700
          ${expanded ? "flex items-center" : "flex justify-center"}
        `}
        >
          <UserCircleIcon className="w-8 h-8 text-slate-400" />
          {expanded && (
            <div className="ml-3 truncate">
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-slate-400 capitalize">
                {user?.role_name}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="fixed bottom-6 left-6 z-30 p-3 bg-emerald-500 rounded-full shadow-lg md:hidden hover:bg-emerald-600 transition-colors"
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <XMarkIcon className="w-6 h-6 text-white" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
};

export default Sidebar;
