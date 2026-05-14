
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
