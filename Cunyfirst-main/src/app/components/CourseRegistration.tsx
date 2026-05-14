import { useEffect, useState } from "react";
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const STUDENT_ID = Number(localStorage.getItem("studentId") || 1);

  const loadCourses = async () => {
    try {
      setLoading(true);

      const [sectionsRes, enrollmentsRes] = await Promise.all([
        fetch(apiUrl("/sections")),
        fetch(apiUrl(`/registration/student/${STUDENT_ID}`)),
      ]);

      const sections = await sectionsRes.json();
      const enrollments = await enrollmentsRes.json();

      const enrolledSectionIds = new Set(
        (enrollments || [])
          .filter((e: any) => e.status === "enrolled")
          .map((e: any) => Number(e.section_id))
      );

      const waitlistedSectionIds = new Set(
        (enrollments || [])
          .filter((e: any) => e.status === "waitlisted")
          .map((e: any) => Number(e.section_id))
      );

      const mapped: Course[] = (sections || []).map((section: any) => {
        const sectionId = Number(section.section_id);
        const course = section.course || {};

        return {
          id: String(sectionId),
          code: course.course_code || `SECTION ${sectionId}`,
          name: course.course_name || "Unknown Course",
          instructor: section.instructor_id
            ? `Instructor ID ${section.instructor_id}`
            : "Instructor TBA",
          seats: Number(section.seats ?? 0),
          totalSeats: Number(section.seats ?? 0),
          credits: Number(course.credits ?? 0),
          schedule: section.schedule || "Schedule TBA",
          location: section.room || "Room TBA",
          registered: enrolledSectionIds.has(sectionId),
          waitlisted: waitlistedSectionIds.has(sectionId),
        };
      });

      setCourses(mapped);
    } catch (error) {
      console.error(error);
      toast.error("Could not load courses from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

const handleRegister = async (id: string, courseName: string) => {
  try {
    const currentlySelectedSectionIds = courses
      .filter((course) => course.registered || course.waitlisted)
      .map((course) => Number(course.id));

    const sectionIds = [...currentlySelectedSectionIds, Number(id)];

    const response = await fetch(apiUrl("/registration/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: STUDENT_ID,
        section_ids: sectionIds,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      toast.error(data.message || "Registration failed.");
      await loadCourses();
      return;
    }

    if (data.waitlisted_sections?.includes(Number(id))) {
      toast.info(`Added to waitlist for ${courseName}`);
    } else {
      toast.success(`Successfully registered for ${courseName}!`);
    }

    await loadCourses();
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

      toast.success(`Dropped ${courseName}`);
      await loadCourses();
    } catch {
      toast.error("Could not connect to backend.");
    }
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const registeredCount = courses.filter(c => c.registered).length;
  const totalCredits = courses
    .filter(c => c.registered)
    .reduce((sum, c) => sum + c.credits, 0);

  if (loading) {
    return <div className="p-8 text-gray-600">Loading courses from backend...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Course Registration</h1>
          <p className="text-gray-600">Search and register for backend-loaded course sections</p>
        </div>

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
            <p className="text-sm text-gray-600 mb-1">Available Sections</p>
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
            <p className="text-gray-600">No backend sections matched your search</p>
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Seats</th>
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          course.seats === 0
                            ? "bg-red-100 text-red-700"
                            : course.seats < 10
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {course.seats}
                        </span>
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
                          ) : (
                            <button
                              onClick={() => handleRegister(course.id, course.name)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow font-medium cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Register
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