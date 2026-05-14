import { useState } from "react";
import { Search, Plus, Check, Trash2, Clock, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { apiUrl, readApiError } from "../utils/api";
interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  seats: number;
  totalSeats: number;
  credits: number;
  schedule: string;
  location: string;
  registered: boolean;
  waitlisted: boolean;
}

export function CourseRegistration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([
    { 
      id: "1", 
      code: "CS 101", 
      name: "Introduction to Computer Science", 
      instructor: "Dr. Sarah Mitchell", 
      seats: 5, 
      totalSeats: 30,
      credits: 3,
      schedule: "MWF 9:00-10:00 AM",
      location: "Room 204, Science Building",
      registered: false, 
      waitlisted: false 
    },
    { 
      id: "2", 
      code: "CS 201", 
      name: "Data Structures and Algorithms", 
      instructor: "Dr. James Anderson", 
      seats: 12, 
      totalSeats: 30,
      credits: 4,
      schedule: "TTh 2:00-3:30 PM",
      location: "Room 315, Science Building",
      registered: true, 
      waitlisted: false 
    },
    { 
      id: "3", 
      code: "MATH 301", 
      name: "Linear Algebra", 
      instructor: "Prof. Emily Rodriguez", 
      seats: 8, 
      totalSeats: 25,
      credits: 3,
      schedule: "MWF 11:00-12:00 PM",
      location: "Room 102, Math Building",
      registered: false, 
      waitlisted: false 
    },
    { 
      id: "4", 
      code: "ENG 102", 
      name: "English Composition II", 
      instructor: "Dr. Michael Brown", 
      seats: 0, 
      totalSeats: 20,
      credits: 3,
      schedule: "TTh 10:00-11:30 AM",
      location: "Room 201, Humanities Hall",
      registered: false, 
      waitlisted: false 
    },
    { 
      id: "5", 
      code: "PHYS 201", 
      name: "General Physics I", 
      instructor: "Dr. Jennifer Davis", 
      seats: 15, 
      totalSeats: 35,
      credits: 4,
      schedule: "MWF 1:00-2:30 PM",
      location: "Room 105, Physics Lab",
      registered: false, 
      waitlisted: false 
    },
    { 
      id: "6", 
      code: "CS 301", 
      name: "Database Systems", 
      instructor: "Prof. Robert Martinez", 
      seats: 6, 
      totalSeats: 25,
      credits: 3,
      schedule: "TTh 4:00-5:30 PM",
      location: "Room 420, Science Building",
      registered: true, 
      waitlisted: false 
    },
    { 
      id: "7", 
      code: "CS 401", 
      name: "Machine Learning", 
      instructor: "Dr. Lisa Thompson", 
      seats: 3, 
      totalSeats: 30,
      credits: 4,
      schedule: "MWF 3:00-4:30 PM",
      location: "Room 510, Science Building",
      registered: false, 
      waitlisted: false 
    },
    { 
      id: "8", 
      code: "ECON 101", 
      name: "Principles of Microeconomics", 
      instructor: "Prof. David Taylor", 
      seats: 20, 
      totalSeats: 40,
      credits: 3,
      schedule: "TTh 11:00-12:30 PM",
      location: "Room 301, Business Building",
      registered: false, 
      waitlisted: false 
    },
  ]);

  const STUDENT_ID = Number(localStorage.getItem("studentId") || 1);

const handleRegister = async (id: string, courseName: string) => {
  try {
    const response = await fetch(apiUrl("/registration/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: STUDENT_ID,
        section_ids: [Number(id)],
      }),
    });

    if (!response.ok) {
      const message = await readApiError(response, "Registration failed.");
      toast.error(message);
      return;
    }

    const data = await response.json();

    setCourses(courses.map(course =>
      course.id === id
        ? {
            ...course,
            registered: data.enrolled_sections?.includes(Number(id)),
            waitlisted: data.waitlisted_sections?.includes(Number(id)),
            seats: data.enrolled_sections?.includes(Number(id))
              ? course.seats - 1
              : course.seats,
          }
        : course
    ));

    if (data.waitlisted_sections?.includes(Number(id))) {
      toast.info(`Added to waitlist for ${courseName}`);
    } else {
      toast.success(`Successfully registered for ${courseName}!`);
    }
  } catch {
    toast.error("Could not connect to backend.");
  }
};

const handleDrop = async (id: string, courseName: string) => {
  try {
    const response = await fetch(apiUrl("/registration/drop"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: STUDENT_ID,
        section_id: Number(id),
      }),
    });

    if (!response.ok) {
      const message = await readApiError(response, "Drop failed.");
      toast.error(message);
      return;
    }

    setCourses(courses.map(course =>
      course.id === id
        ? {
            ...course,
            registered: false,
            waitlisted: false,
            seats: course.seats + 1,
          }
        : course
    ));

    toast.success(`Dropped ${courseName}`);
  } catch {
    toast.error("Could not connect to backend.");
  }
};

  const handleWaitlist = (id: string, courseName: string) => {
    setCourses(courses.map(course =>
      course.id === id ? { ...course, waitlisted: true, registered: false } : course
    ));
    toast.info(`Added to waitlist for ${courseName}`);
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const registeredCount = courses.filter(c => c.registered).length;
  const totalCredits = courses.filter(c => c.registered).reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Course Registration</h1>
          <p className="text-gray-600">Search and register for courses - Spring 2026</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 mb-1">Registered Courses</p>
            <p className="text-2xl text-gray-900">{registeredCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 mb-1">Total Credits</p>
            <p className="text-2xl text-gray-900">{totalCredits}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-600">
            <p className="text-sm text-gray-600 mb-1">Available Courses</p>
            <p className="text-2xl text-gray-900">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by code, name, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300"
            />
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Course Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Course Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Instructor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Schedule</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Credits</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Seats Available</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-blue-600">{course.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900 font-medium">{course.name}</p>
                          <p className="text-sm text-gray-500">{course.location}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{course.instructor}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{course.schedule}</td>
                      <td className="px-6 py-4 text-gray-900">{course.credits}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            course.seats === 0
                              ? "bg-red-100 text-red-700"
                              : course.seats < 10
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {course.seats}/{course.totalSeats}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {course.registered ? (
                            <>
                              <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                                <Check className="w-4 h-4" />
                                Registered
                              </span>
                              <button
                                onClick={() => handleDrop(course.id, course.name)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Drop
                              </button>
                            </>
                          ) : course.waitlisted ? (
                            <>
                              <span className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium">
                                <Clock className="w-4 h-4" />
                                Waitlisted
                              </span>
                              <button
                                onClick={() => handleDrop(course.id, course.name)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </>
                          ) : course.seats > 0 ? (
                            <button
                              onClick={() => handleRegister(course.id, course.name)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow font-medium cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Register
                            </button>
                          ) : (
                            <button
                              onClick={() => handleWaitlist(course.id, course.name)}
                              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-sm hover:shadow font-medium cursor-pointer"
                            >
                              <Clock className="w-4 h-4" />
                              Join Waitlist
                            </button>
                          )}
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
    </div>
  );
}