import { useLocation, useNavigate } from "react-router";
import { BookOpen, Users, Calendar, Info, Eye } from "lucide-react";
import { toast } from "sonner";

export function GuestDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const isStudentGuest = location.pathname.includes("guest-student");
  const isInstructorGuest = location.pathname.includes("guest-instructor");
  const isRegistrarGuest = location.pathname.includes("guest-registrar");

  const getRoleTitle = () => {
    if (isStudentGuest) return "Student Portal";
    if (isInstructorGuest) return "Instructor Portal";
    if (isRegistrarGuest) return "Registrar Portal";
    return "Guest Portal";
  };

  const getRoleDescription = () => {
    if (isStudentGuest) return "Explore student features in view-only mode";
    if (isInstructorGuest) return "Explore instructor features in view-only mode";
    if (isRegistrarGuest) return "Explore registrar features in view-only mode";
    return "View-only access to the portal";
  };

  const studentCards = [
    { icon: BookOpen, title: "Browse Courses", description: "View available courses and sections", color: "bg-blue-500" },
    { icon: Calendar, title: "Sample Schedule", description: "See example student schedules", color: "bg-green-500" },
    { icon: Info, title: "Registration Info", description: "Learn about the registration process", color: "bg-purple-500" },
  ];

  const instructorCards = [
    { icon: BookOpen, title: "Course Overview", description: "View sample course assignments", color: "bg-blue-500" },
    { icon: Users, title: "Student Rosters", description: "See example class rosters", color: "bg-green-500" },
    { icon: Info, title: "Grading System", description: "Explore the grading interface", color: "bg-orange-500" },
  ];

  const registrarCards = [
    { icon: BookOpen, title: "Course Management", description: "View course administration tools", color: "bg-blue-500" },
    { icon: Users, title: "Student Management", description: "See student administration features", color: "bg-green-500" },
    { icon: Info, title: "Approval System", description: "Explore the approval workflow", color: "bg-purple-500" },
  ];

  const cards = isStudentGuest ? studentCards : isInstructorGuest ? instructorCards : registrarCards;

  const handleExplore = (title: string) => {
    toast.info(`${title} - This feature is view-only in guest mode. Create an account to access full functionality!`);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Guest Notice Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-gray-900 mb-2">Guest Access Mode</h2>
              <p className="text-gray-600 mb-3">
                You are viewing the portal in guest mode. This is a demonstration environment with limited access.
                To unlock full functionality, please log in with your credentials or contact your administrator.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/create-account")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Account
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Return to Login
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Welcome to {getRoleTitle()}</h1>
          <p className="text-gray-600">{getRoleDescription()}</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 hover:border-blue-200 border border-transparent transform hover:-translate-y-1 group"
              >
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                <button
                  onClick={() => handleExplore(card.title)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2 cursor-pointer transition-all duration-300 hover:gap-3"
                >
                  Explore
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sample Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-4">System Features</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900">Real-time Course Availability</p>
                  <p className="text-sm text-gray-600">See live seat counts and waitlist status</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900">Interactive Schedule Builder</p>
                  <p className="text-sm text-gray-600">Visual calendar with conflict detection</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-900">Automated Waitlist Management</p>
                  <p className="text-sm text-gray-600">Queue position tracking and notifications</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-gray-900 mb-4">Getting Started</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  1
                </div>
                <p className="text-gray-900">Create your account or sign in</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <p className="text-gray-900">Browse available courses for the semester</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <p className="text-gray-900">Add courses and build your schedule</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                  4
                </div>
                <p className="text-gray-900">Submit and confirm your registration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
