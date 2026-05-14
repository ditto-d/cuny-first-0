import { useEffect, useState } from "react";
import { Clock, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiUrl, readApiError } from "../utils/api";

interface WaitlistCourse {
  id: number;
  code: string;
  name: string;
  instructor: string;
  schedule: string;
  sectionId: number;
}

export function Waitlist() {
  const [waitlistCourses, setWaitlistCourses] = useState<WaitlistCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = Number(localStorage.getItem("studentId") || 1);

  useEffect(() => {
    loadWaitlist();
  }, []);

  const loadWaitlist = async () => {
    try {
      const response = await fetch(apiUrl(`/registration/student/${studentId}`));
      const data = await response.json();

      const mapped = (data || [])
        .filter((enrollment: any) => enrollment.status === "waitlisted")
        .map((enrollment: any) => ({
          id: enrollment.enrollment_id,
          sectionId: enrollment.section_id,
          code: enrollment.section?.course?.course_code || `Section ${enrollment.section_id}`,
          name: enrollment.section?.course?.course_name || "Unknown Course",
          instructor: enrollment.section?.instructor_id
            ? `Instructor ID ${enrollment.section.instructor_id}`
            : "Instructor TBA",
          schedule: enrollment.section?.schedule || "Schedule TBA",
        }));

      setWaitlistCourses(mapped);
    } catch (error) {
      toast.error("Could not load waitlist from backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWaitlist = async (sectionId: number, courseName: string) => {
    try {
      const response = await fetch(apiUrl("/registration/drop"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId,
          section_id: sectionId,
        }),
      });

      if (!response.ok) {
        const message = await readApiError(response, "Could not remove from waitlist.");
        toast.error(message);
        return;
      }

      setWaitlistCourses((prev) => prev.filter((course) => course.sectionId !== sectionId));
      toast.success(`Removed from waitlist: ${courseName}`);
    } catch {
      toast.error("Could not connect to backend.");
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-600">Loading waitlist...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Waitlist</h1>
          <p className="text-gray-600">Track your waitlisted courses from the backend database</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How the waitlist works</p>
            <p className="text-blue-700">
              If a course is full, the backend places you on the waitlist. Only the assigned instructor can admit waitlisted students.
            </p>
          </div>
        </div>

        {waitlistCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">No Waitlisted Courses</h3>
            <p className="text-gray-600 mb-6">You are not currently on any course waitlists</p>
            <a
              href="/student/register"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow font-medium"
            >
              Browse Courses
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {waitlistCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-blue-600">{course.code}</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Waitlisted
                      </span>
                    </div>

                    <h3 className="text-xl text-gray-900 mb-1">{course.name}</h3>
                    <p className="text-gray-600 mb-1">{course.instructor}</p>
                    <p className="text-sm text-gray-500">{course.schedule}</p>
                  </div>

                  <button
                    onClick={() => handleRemoveFromWaitlist(course.sectionId, course.name)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove from waitlist"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1 font-medium">Status</p>
                    <p className="text-2xl text-blue-600 font-semibold">Waitlisted</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1 font-medium">Section ID</p>
                    <p className="text-2xl text-gray-900 font-semibold">{course.sectionId}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Admission from this waitlist must be approved by the instructor.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}