import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Calendar, Clock, User, TrendingUp, Award, Bell, Bot, FileText, MessageSquare, GraduationCap } from "lucide-react";
import { apiUrl } from "../utils/api";

interface Enrollment {
  status?: string;
  section?: {
    section_id?: number;
    schedule?: string;
    room?: string;
    course?: {
      course_code?: string;
      course_name?: string;
      credits?: number;
    };
  };
}

export function StudentDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "Student";
  const studentId = localStorage.getItem("studentId") || "1";

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [gpa, setGpa] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const [enrollRes, gpaRes] = await Promise.all([
          fetch(apiUrl(`/registration/student/${studentId}`)),
          fetch(apiUrl(`/gpa/${studentId}`)),
        ]);

        if (enrollRes.ok) {
          const data = await enrollRes.json();
          setEnrollments(data || []);
        }

        if (gpaRes.ok) {
          const gpaData = await gpaRes.json();
          if (gpaData.success) {
            setGpa(gpaData.gpa);
          }
        }
      } catch (error) {
        console.error("Failed to load student dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [studentId]);

  const enrolledCourses = enrollments.filter((e) => e.status === "enrolled");
  const waitlistedCourses = enrollments.filter((e) => e.status === "waitlisted");

  const enrolledCount = enrolledCourses.length;
  const totalCredits = enrolledCourses.reduce(
    (sum, e) => sum + Number(e.section?.course?.credits || 0),
    0
  );

  const todaysSchedule = enrolledCourses.slice(0, 3);

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
      icon: FileText,
      title: "My Grades",
      description: "View your grades and GPA",
      color: "from-teal-500 to-teal-600",
      path: "/student/grades",
    },
    {
      icon: Bot,
      title: "AI Advisor",
      description: "Get academic guidance from the AI assistant",
      color: "from-purple-500 to-pink-500",
      path: "/student/ai-advisor",
    },
    {
      icon: MessageSquare,
      title: "Reviews",
      description: "Rate and review your courses",
      color: "from-yellow-500 to-yellow-600",
      path: "/student/reviews",
    },
    {
      icon: Bell,
      title: "Complaints",
      description: "File a formal complaint",
      color: "from-red-500 to-red-600",
      path: "/student/complaints",
    },
    {
      icon: GraduationCap,
      title: "Graduation",
      description: "Apply for graduation",
      color: "from-indigo-500 to-indigo-600",
      path: "/student/graduation",
    },
    {
      icon: User,
      title: "Profile",
      description: "View your account information",
      color: "from-gray-500 to-gray-600",
      path: "/student/profile",
    },
  ];

  if (loading) {
    return <div className="p-8 text-gray-600">Loading student dashboard...</div>;
  }

  const getGpaColor = () => {
    if (gpa === null) return "text-gray-400";
    if (gpa >= 3.5) return "text-green-400";
    if (gpa >= 2.25) return "text-blue-400";
    if (gpa >= 2.0) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">Welcome back, {username}! 👋</h1>
          <p className="text-gray-600 text-lg">Student ID: {studentId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-80">Academic</span>
            </div>
            <p className="text-sm opacity-90 mb-1">GPA</p>
            <p className={`text-4xl font-bold ${getGpaColor()}`}>
              {gpa !== null ? gpa.toFixed(2) : "N/A"}
            </p>
            <p className="text-xs opacity-80 mt-2">
              {gpa !== null ? "Cumulative GPA" : "No grades posted yet"}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-80">Current Load</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Registered Credits</p>
            <p className="text-4xl font-bold">{totalCredits}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-sm opacity-80">Semester</span>
            </div>
            <p className="text-sm opacity-90 mb-1">Enrolled Courses</p>
            <p className="text-4xl font-bold">{enrolledCount}</p>
            <p className="text-xs opacity-80 mt-2">Waitlisted: {waitlistedCourses.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-gray-900 font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Enrolled Sections
              </h2>
            </div>

            <div className="space-y-4">
              {todaysSchedule.length > 0 ? (
                todaysSchedule.map((enrollment, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-mono text-xs">
                        {enrollment.section?.course?.course_code || "SEC"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {enrollment.section?.course?.course_code || "Unknown Course"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {enrollment.section?.course?.course_name || "No course name"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {enrollment.section?.schedule || "Schedule TBA"} · {enrollment.section?.room || "Room TBA"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No enrolled courses found.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl text-gray-900 font-semibold flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-orange-600" />
              Registration Status
            </h2>

            <div className="space-y-4">
              {enrolledCount < 2 && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-gray-900 font-medium">Low Course Load</p>
                  <p className="text-sm text-gray-600">
                    You currently have fewer than 2 enrolled courses.
                  </p>
                </div>
              )}

              {gpa !== null && gpa < 2.0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-gray-900 font-medium">GPA Alert</p>
                  <p className="text-sm text-gray-600">
                    Your GPA is below 2.0. Please contact the registrar immediately.
                  </p>
                </div>
              )}

              {gpa !== null && gpa >= 2.0 && gpa <= 2.25 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-gray-900 font-medium">Registrar Interview Required</p>
                  <p className="text-sm text-gray-600">
                    Your GPA is between 2.0 and 2.25. A registrar interview is required.
                  </p>
                </div>
              )}

              {gpa !== null && gpa > 3.75 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-gray-900 font-medium">Honor Roll</p>
                  <p className="text-sm text-gray-600">
                    Congratulations! Your GPA qualifies you for the honor roll.
                  </p>
                </div>
              )}

              {waitlistedCourses.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-gray-900 font-medium">Waitlist Active</p>
                  <p className="text-sm text-gray-600">
                    You are waitlisted for {waitlistedCourses.length} section(s).
                  </p>
                </div>
              )}

              {enrolledCount >= 2 && waitlistedCourses.length === 0 && (gpa === null || gpa > 2.25) && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-gray-900 font-medium">Registration Looks Good</p>
                  <p className="text-sm text-gray-600">
                    Your current enrolled course count satisfies the minimum requirement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
