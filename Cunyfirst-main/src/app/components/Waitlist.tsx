import { useState } from "react";
import { Clock, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WaitlistCourse {
  id: string;
  code: string;
  name: string;
  instructor: string;
  position: number;
  totalWaitlist: number;
  estimatedDate: string;
  schedule: string;
}

export function Waitlist() {
  const [waitlistCourses, setWaitlistCourses] = useState<WaitlistCourse[]>([
    {
      id: "1",
      code: "CS 401",
      name: "Machine Learning",
      instructor: "Dr. Lisa Thompson",
      position: 3,
      totalWaitlist: 8,
      estimatedDate: "May 5, 2026",
      schedule: "MWF 3:00-4:30 PM"
    },
  ]);

  const handleRemoveFromWaitlist = (id: string, courseName: string) => {
    setWaitlistCourses(waitlistCourses.filter(course => course.id !== id));
    toast.success(`Removed from waitlist: ${courseName}`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Waitlist</h1>
          <p className="text-gray-600">Track your waitlisted courses and queue positions</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How the waitlist works</p>
            <p className="text-blue-700">You'll receive an email notification when a seat becomes available. You'll have 24 hours to register for the course before it's offered to the next person on the waitlist.</p>
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
                    onClick={() => handleRemoveFromWaitlist(course.id, course.name)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove from waitlist"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-700 mb-1 font-medium">Your Position</p>
                    <p className="text-3xl text-blue-600 font-semibold">#{course.position}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1 font-medium">Total on Waitlist</p>
                    <p className="text-3xl text-gray-900 font-semibold">{course.totalWaitlist}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1 font-medium">Estimated Opening</p>
                    <p className="text-lg text-gray-900 font-medium">{course.estimatedDate}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>You will be notified via email when a seat becomes available</span>
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