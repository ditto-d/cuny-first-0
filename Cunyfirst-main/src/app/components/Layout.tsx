import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, BookOpen, Calendar, Clock, Settings, LogOut, Users, FileText, Megaphone, CheckCircle, Eye, User, Bot } from "lucide-react";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isStudent = location.pathname.startsWith("/student");
  const isInstructor = location.pathname.startsWith("/instructor");
  const isRegistrar = location.pathname.startsWith("/registrar");
  const isGuestStudent = location.pathname.startsWith("/guest-student");
  const isGuestInstructor = location.pathname.startsWith("/guest-instructor");
  const isGuestRegistrar = location.pathname.startsWith("/guest-registrar");
  const isGuest = isGuestStudent || isGuestInstructor || isGuestRegistrar;

  const studentNavItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", path: isGuest ? "/guest-student" : "/student" },
    { id: "register", icon: BookOpen, label: "Register Courses", path: isGuest ? "/guest-student" : "/student/register" },
    { id: "schedule", icon: Calendar, label: "My Schedule", path: isGuest ? "/guest-student" : "/student/schedule" },
    { id: "waitlist", icon: Clock, label: "Waitlist", path: isGuest ? "/guest-student" : "/student/waitlist" },
    { id: "ai-advisor", icon: Bot, label: "AI Advisor", path: isGuest ? "/guest-student" : "/student/ai-advisor" },
  ];

  const instructorNavItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", path: isGuest ? "/guest-instructor" : "/instructor" },
    { id: "courses", icon: BookOpen, label: "My Courses", path: isGuest ? "/guest-instructor" : "/instructor" },
    { id: "rosters", icon: Users, label: "Student Rosters", path: isGuest ? "/guest-instructor" : "/instructor" },
    { id: "grades", icon: FileText, label: "Grades", path: isGuest ? "/guest-instructor" : "/instructor" },
    { id: "announcements", icon: Megaphone, label: "Announcements", path: isGuest ? "/guest-instructor" : "/instructor" },
  ];

  const registrarNavItems = [
    { id: "courses", icon: BookOpen, label: "Manage Courses", path: isGuest ? "/guest-registrar" : "/registrar?tab=courses" },
    { id: "students", icon: Users, label: "Manage Students", path: isGuest ? "/guest-registrar" : "/registrar?tab=students" },
    { id: "approvals", icon: CheckCircle, label: "Approvals", path: isGuest ? "/guest-registrar" : "/registrar?tab=approvals" },
    { id: "settings", icon: Settings, label: "Settings", path: isGuest ? "/guest-registrar" : "/registrar?tab=settings" },
  ];

  const navItems = (isStudent || isGuestStudent)
    ? studentNavItems
    : (isInstructor || isGuestInstructor)
    ? instructorNavItems
    : registrarNavItems;

  const getRoleLabel = () => {
    if (isStudent) return "Student";
    if (isInstructor) return "Instructor";
    if (isRegistrar) return "Registrar";
    if (isGuestStudent) return "Guest Student";
    if (isGuestInstructor) return "Guest Instructor";
    if (isGuestRegistrar) return "Guest Registrar";
    return "User";
  };

  const getRoleColor = () => {
    if (isStudent || isGuestStudent) return "bg-gradient-to-br from-blue-600 to-indigo-600";
    if (isInstructor || isGuestInstructor) return "bg-gradient-to-br from-green-600 to-emerald-600";
    if (isRegistrar || isGuestRegistrar) return "bg-gradient-to-br from-purple-600 to-indigo-600";
    return "bg-gradient-to-br from-blue-600 to-indigo-600";
  };

  const getActiveColor = () => {
    if (isGuest) return "bg-orange-50 text-orange-600";
    if (isStudent || isGuestStudent) return "bg-blue-50 text-blue-600";
    if (isInstructor || isGuestInstructor) return "bg-green-50 text-green-600";
    if (isRegistrar || isGuestRegistrar) return "bg-purple-50 text-purple-600";
    return "bg-blue-50 text-blue-600";
  };

  const getProfilePath = () => {
    if (isStudent) return "/student/profile";
    if (isInstructor) return "/instructor/profile";
    if (isRegistrar) return "/registrar/profile";
    return "/student/profile";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${getRoleColor()} rounded-xl flex items-center justify-center shadow-md`}>
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold">CUNYfirst</h2>
              <p className="text-sm text-gray-500">{getRoleLabel()} Portal</p>
            </div>
          </div>
        </div>

        {/* Guest Badge */}
        {isGuest && (
          <div className="mx-4 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Guest Mode</span>
            </div>
            <p className="text-xs text-orange-700">View-only access</p>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const currentPath = `${location.pathname}${location.search}`;
            const isActive =
              currentPath === item.path ||
              (isRegistrar && !location.search && item.id === "courses" && item.path === "/registrar?tab=courses") ||
              (isGuest && location.pathname === item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium cursor-pointer ${
                  isActive
                    ? `${getActiveColor()} shadow-sm`
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1">
          {!isGuest && (
            <button
              onClick={() => navigate(getProfilePath())}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-700 hover:bg-gray-50 font-medium cursor-pointer ${
                location.pathname.includes("/profile") ? getActiveColor() : ""
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-sm">Profile & Settings</span>
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">{isGuest ? "Exit Guest Mode" : "Logout"}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="animate-in fade-in duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
