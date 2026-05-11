import { useNavigate } from "react-router";
import { BookOpen, Calendar, Clock, User, TrendingUp, Award, Bell, Bot } from "lucide-react";

export function StudentDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Student";

  const cards = [
    {
      icon: BookOpen,
      title: "Register Courses",
      description: "Browse and register for available courses",
      color: "from-blue-500 to-blue-600",
      path: "/student/register",
    },
    {
      icon: Calendar,
      title: "My Schedule",
      description: "View your weekly class schedule",
      color: "from-green-500 to-green-600",
      path: "/student/schedule",
    },
    {
      icon: Clock,
      title: "Waitlist",
      description: "Check your waitlisted courses",
      color: "from-orange-500 to-orange-600",
      path: "/student/waitlist",
    },
    {
      icon: Bot,
      title: "AI Advisor",
      description: "Get personalized academic guidance",
      color: "from-purple-500 to-pink-500",
      path: "/student/ai-advisor",
    },
    {
      icon: User,
      title: "Profile",
      description: "Manage your account settings",
      color: "from-indigo-500 to-purple-600",
      path: "/student/profile",
    },
  ];

  const upcomingClasses = [
    { course: "CS 201", name: "Data Structures", time: "2:00 PM", room: "Room 315, Science Building" },
    { course: "CS 301", name: "Database Systems", time: "4:00 PM", room: "Room 420, Science Building" },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">Welcome back, {username}! 👋</h1>
          <p className="text-gray-600 text-lg">Spring 2026 Semester - Computer Science Major</p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 text-left group border border-gray-100 cursor-pointer hover:border-blue-200 transform hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-br ${card.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2 font-semibold">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-80">Academic</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-90 mb-1">Current GPA</p>
                <p className="text-4xl font-bold">3.85</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-80">Progress</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-90 mb-1">Credits Earned</p>
                <p className="text-4xl font-bold">76</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-80">Semester</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm opacity-90 mb-1">Enrolled Courses</p>
                <p className="text-4xl font-bold">4</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900 font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today's Schedule
              </h2>
              <span className="text-sm text-gray-500">Thursday, Apr 24</span>
            </div>
            <div className="space-y-4">
              {upcomingClasses.map((cls, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-mono text-xs">{cls.course.split(' ')[1]}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{cls.course}</p>
                        <p className="text-sm text-gray-600">{cls.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{cls.room}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">{cls.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingClasses.length === 0 && (
                <p className="text-center text-gray-500 py-4">No classes scheduled for today</p>
              )}
            </div>
          </div>

          {/* Important Dates & Announcements */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl text-gray-900 font-semibold flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-orange-600" />
              Important Dates
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-orange-700 font-medium">MAY</span>
                    <span className="text-lg font-bold text-orange-600">01</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Add/Drop Deadline</p>
                  <p className="text-sm text-gray-600">Last day to modify courses</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-blue-700 font-medium">JUN</span>
                    <span className="text-lg font-bold text-blue-600">15</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Midterm Exams</p>
                  <p className="text-sm text-gray-600">Week of midterm assessments</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-purple-700 font-medium">AUG</span>
                    <span className="text-lg font-bold text-purple-600">10</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Final Exams</p>
                  <p className="text-sm text-gray-600">End of semester exams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}