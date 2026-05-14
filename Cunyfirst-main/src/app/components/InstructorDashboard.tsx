import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BookOpen, Bot, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../utils/api";

type TabType = "courses" | "rosters" | "grades" | "announcements";

export function InstructorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeSelections, setGradeSelections] = useState<Record<number, string>>({});
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmittingGrades, setIsSubmittingGrades] = useState(false);

  const requestedTab = searchParams.get("tab");
  const activeTab: TabType =
    requestedTab === "rosters" || requestedTab === "grades" || requestedTab === "announcements"
      ? requestedTab
      : "courses";

  const instructorId = Number(localStorage.getItem("instructorId") || 1);

  const announcements = [
    { id: "1", title: "Midterm Exam Schedule", date: "2026-04-20", course: "CS 101", content: "Midterm exam will be held on May 15th" },
    { id: "2", title: "Office Hours Change", date: "2026-04-18", course: "CS 201", content: "Office hours moved to Thursday 3-5 PM" },
    { id: "3", title: "Assignment 3 Posted", date: "2026-04-15", course: "CS 301", content: "New assignment available on the portal" },
  ];

  const selectedSectionId = courses.find((course) => course.id === selectedCourse)?.sectionId;

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch(apiUrl(`/instructors/${instructorId}/sections`));
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not load instructor sections.");
      }

      const mappedCourses = (data.sections ?? []).map((section: any) => {
        const course = section.course ?? {};
        const sectionId = Number(section.section_id);

        return {
          id: String(sectionId),
          code: course.course_code || `SECTION ${sectionId}`,
          name: course.course_name || "Unknown Course",
          section: section.section_number || String(sectionId),
          sectionId,
          enrolled: Number(section.enrolled_count ?? 0),
          waitlisted: Number(section.waitlisted_count ?? 0),
          capacity: Number(section.seats ?? 0),
          credits: Number(course.credits ?? 0),
          schedule: section.schedule || "Schedule TBA",
          room: section.room || "Room TBA",
          semester: [section.semester, section.year].filter(Boolean).join(" ") || "Current Term",
        };
      });

      setCourses(mappedCourses);
      setSelectedCourse((current) => current ?? mappedCourses[0]?.id ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load instructor sections.";
      toast.error(message);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadRoster = async (sectionId: number) => {
    setIsLoadingRoster(true);
    try {
      const response = await fetch(apiUrl(`/sections/${sectionId}/roster`));
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not load roster.");
      }

      const mappedStudents = (data.enrollments ?? [])
        .filter((enrollment: any) => (enrollment.status ?? "enrolled") === "enrolled")
        .map((enrollment: any) => {
          const account = enrollment.student?.account ?? {};
          const grade = Array.isArray(enrollment.grade) ? enrollment.grade[0] : enrollment.grade;
          const studentId = Number(enrollment.student_id);
          const displayName = [account.first_name, account.last_name].filter(Boolean).join(" ");

          return {
            id: studentId,
            name: displayName || `Student ${studentId}`,
            studentId: `STU${String(studentId).padStart(3, "0")}`,
            email: account.email || "Email unavailable",
            currentGrade: grade?.letter_grade || "",
          };
        });

      setStudents(mappedStudents);
      setGradeSelections(
        mappedStudents.reduce<Record<number, string>>((current, student) => {
          if (student.currentGrade) current[student.id] = student.currentGrade;
          return current;
        }, {})
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load roster.";
      toast.error(message);
      setStudents([]);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [instructorId]);

  useEffect(() => {
    if ((activeTab === "rosters" || activeTab === "grades") && selectedSectionId) {
      loadRoster(selectedSectionId);
    }
  }, [activeTab, selectedSectionId]);

  const handleGradeChange = (studentId: number, grade: string) => {
    setGradeSelections((current) => ({ ...current, [studentId]: grade }));
  };

  const handleSubmitAllGrades = async () => {
    if (!selectedSectionId) return;

    const toSubmit = students.filter((student) => gradeSelections[student.id]);
    if (toSubmit.length === 0) {
      toast.error("No grades selected. Please select at least one grade to submit.");
      return;
    }

    setIsSubmittingGrades(true);
    let successCount = 0;
    let failCount = 0;

    for (const student of toSubmit) {
      try {
        const response = await fetch(apiUrl("/grades/submit"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instructor_id: instructorId,
            section_id: selectedSectionId,
            student_id: student.id,
            letter_grade: gradeSelections[student.id],
          }),
        });

        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed for student ${student.name}: ${data.message}`);
        }
      } catch {
        failCount++;
      }
    }

    setIsSubmittingGrades(false);

    if (successCount > 0) {
      toast.success(`${successCount} grade(s) submitted successfully.`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} grade(s) failed to submit.`);
    }

    if (selectedSectionId) {
      await loadRoster(selectedSectionId);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">Instructor Dashboard</h1>
            <p className="text-gray-600">Manage your courses and students</p>
          </div>
          <button
            onClick={() => navigate("/instructor/ai-advisor")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Bot className="w-4 h-4" />
            Open AI Advisor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            label="Total Courses"
            value={courses.length}
            icon={BookOpen}
            colorClass="text-blue-600"
            iconClass="bg-blue-100 text-blue-600"
          />
          <SummaryCard
            label="Total Students"
            value={courses.reduce((total, course) => total + course.enrolled, 0)}
            icon={Users}
            colorClass="text-green-600"
            iconClass="bg-green-100 text-green-600"
          />
          <SummaryCard
            label="Pending Grades"
            value={students.filter((student) => !gradeSelections[student.id]).length}
            icon={FileText}
            colorClass="text-orange-600"
            iconClass="bg-orange-100 text-orange-600"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            {activeTab === "courses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-gray-900">My Courses - Spring 2026</h2>
                </div>
                {isLoadingCourses ? (
                  <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                    Loading your sections...
                  </div>
                ) : courses.length === 0 ? (
                  <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                    No assigned sections were found for this instructor account.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {course.code}
                            </span>
                            <span className="text-sm text-gray-600">Section {course.section}</span>
                          </div>
                          <h3 className="text-gray-900 mb-2">{course.name}</h3>
                          <p className="text-sm text-gray-600">{course.schedule}</p>
                          <p className="text-xs text-gray-500 mt-1">{course.room} - {course.semester}</p>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Enrolled</span>
                            <span className="text-gray-900">
                              {course.enrolled}/{course.capacity}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${course.capacity ? (course.enrolled / course.capacity) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">{course.waitlisted} waitlisted</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCourse(course.id);
                            navigate("/instructor?tab=rosters");
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Course
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "rosters" && (
              <div>
                <CourseSelect
                  courses={courses}
                  selectedCourse={selectedCourse}
                  onChange={setSelectedCourse}
                />

                {selectedCourse && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-gray-900">Student Roster</h2>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Export to CSV
                      </button>
                    </div>
                    {isLoadingRoster ? (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                        Loading roster...
                      </div>
                    ) : (
                      <StudentTable students={students} mode="roster" />
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "grades" && (
              <div>
                <CourseSelect
                  courses={courses}
                  selectedCourse={selectedCourse}
                  onChange={(courseId) => {
                    setSelectedCourse(courseId);
                    setGradeSelections({});
                  }}
                />

                {selectedCourse && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-gray-900">Grade Submission</h2>
                      <button
                        onClick={handleSubmitAllGrades}
                        disabled={isSubmittingGrades}
                        className={`px-4 py-2 rounded-lg text-white transition-colors font-medium ${
                          isSubmittingGrades
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {isSubmittingGrades ? "Submitting..." : "Submit All Grades"}
                      </button>
                    </div>
                    {isLoadingRoster ? (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                        Loading roster...
                      </div>
                    ) : (
                      <StudentTable
                        students={students}
                        mode="grades"
                        gradeSelections={gradeSelections}
                        onGradeChange={handleGradeChange}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "announcements" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-gray-900">Course Announcements</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    New Announcement
                  </button>
                </div>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-gray-900 mb-1">{announcement.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>{announcement.course}</span>
                            <span>-</span>
                            <span>{announcement.date}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            Edit
                          </button>
                          <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: typeof BookOpen;
  colorClass: string;
  iconClass: string;
};

function SummaryCard({ label, value, icon: Icon, colorClass, iconClass }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{label}</p>
          <p className={`text-3xl ${colorClass}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

type Course = {
  id: string;
  code: string;
  name: string;
  section: string;
  sectionId: number;
  enrolled: number;
  waitlisted: number;
  capacity: number;
  credits: number;
  schedule: string;
  room: string;
  semester: string;
};

function CourseSelect({
  courses,
  selectedCourse,
  onChange,
}: {
  courses: Course[];
  selectedCourse: string | null;
  onChange: (courseId: string) => void;
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm text-gray-700 mb-2">Select Course</label>
      <select
        value={selectedCourse || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full md:w-96 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Choose a course...</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.code} - {course.name}
          </option>
        ))}
      </select>
    </div>
  );
}

type Student = {
  id: number;
  name: string;
  studentId: string;
  email: string;
  currentGrade?: string;
};

function StudentTable({
  students,
  mode,
  gradeSelections = {},
  onGradeChange,
}: {
  students: Student[];
  mode: "roster" | "grades";
  gradeSelections?: Record<number, string>;
  onGradeChange?: (studentId: number, grade: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm text-gray-700">Student ID</th>
            <th className="px-6 py-3 text-left text-sm text-gray-700">Name</th>
            {mode === "roster" ? (
              <>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
              </>
            ) : (
              <th className="px-6 py-3 text-left text-sm text-gray-700">Final Grade</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-gray-900">{student.studentId}</td>
              <td className="px-6 py-4 text-gray-900">{student.name}</td>
              {mode === "roster" ? (
                <>
                  <td className="px-6 py-4 text-gray-600">{student.email}</td>
                  <td className="px-6 py-4">
                    <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      View Profile
                    </button>
                  </td>
                </>
              ) : (
                <td className="px-6 py-4">
                  <select
                    value={gradeSelections[student.id] || ""}
                    onChange={(event) => onGradeChange?.(student.id, event.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Grade</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="B-">B-</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="C-">C-</option>
                    <option value="D+">D+</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                    <option value="W">W</option>
                    <option value="I">I</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
