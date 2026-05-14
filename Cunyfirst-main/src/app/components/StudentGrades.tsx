import { useEffect, useState } from "react";
import { TrendingUp, BookOpen, Award, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../utils/api";

interface GradeRecord {
  section_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  semester: string;
  letter_grade: string;
  date_assigned: string;
}

export function StudentGrades() {
  const studentId = localStorage.getItem("studentId") || "1";
  const [gpa, setGpa] = useState<number | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    setLoading(true);
    try {
      const [gpaRes, gradesRes] = await Promise.all([
        fetch(apiUrl(`/gpa/${studentId}`)),
        fetch(apiUrl(`/grades/${studentId}`)),
      ]);

      if (gpaRes.ok) {
        const gpaData = await gpaRes.json();
        setGpa(gpaData.gpa ?? null);
      }

      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(gradesData.grades ?? []);
      }
    } catch {
      toast.error("Could not load grades from backend.");
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (["A", "A-"].indexOf(grade) !== -1) return "bg-green-100 text-green-700";
    if (["B+", "B", "B-"].indexOf(grade) !== -1) return "bg-blue-100 text-blue-700";
    if (["C+", "C", "C-"].indexOf(grade) !== -1) return "bg-yellow-100 text-yellow-700";
    if (["D+", "D"].indexOf(grade) !== -1) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  const getStandingColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-green-600";
    if (gpa >= 2.25) return "text-blue-600";
    if (gpa >= 2.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getStandingLabel = (gpa: number) => {
    if (gpa > 3.75) return "Honor Roll";
    if (gpa >= 3.5) return "Good Standing";
    if (gpa >= 2.25) return "Good Standing";
    if (gpa >= 2.0) return "Warning";
    return "At Risk";
  };

  if (loading) {
    return <div className="p-8 text-gray-600">Loading grades...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">My Grades & GPA</h1>
          <p className="text-gray-600">View your academic performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-500">Cumulative</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">GPA</p>
            <p className={`text-4xl font-bold ${gpa !== null ? getStandingColor(gpa) : "text-gray-400"}`}>
              {gpa !== null ? gpa.toFixed(2) : "N/A"}
            </p>
            {gpa !== null && (
              <p className="text-sm text-gray-500 mt-2">{getStandingLabel(gpa)}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Graded Courses</p>
            <p className="text-4xl font-bold text-gray-900">{grades.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-gray-500">Progress</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Courses Toward Graduation</p>
            <p className="text-4xl font-bold text-gray-900">{grades.length} / 8</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min((grades.length / 8) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {gpa !== null && gpa < 2.0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-medium">Academic Standing Warning</p>
              <p className="text-sm text-red-700">Your GPA is below 2.0. Please contact the registrar immediately.</p>
            </div>
          </div>
        )}

        {gpa !== null && gpa >= 2.0 && gpa <= 2.25 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-900 font-medium">Registrar Interview Required</p>
              <p className="text-sm text-yellow-700">Your GPA is between 2.0 and 2.25. A registrar interview has been scheduled.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900 font-semibold">Grade History</h2>
          </div>

          {grades.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No grades have been posted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Course Code</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Course Name</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Semester</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Grade</th>
                    <th className="px-6 py-3 text-left text-sm text-gray-700">Date Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {grades.map((grade, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm text-blue-600">{grade.course_code}</td>
                      <td className="px-6 py-4 text-gray-900">{grade.course_name}</td>
                      <td className="px-6 py-4 text-gray-600">{grade.semester}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.letter_grade)}`}>
                          {grade.letter_grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {grade.date_assigned ? new Date(grade.date_assigned).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
