import { useEffect, useState } from "react";
import { GraduationCap, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../utils/api";

export function StudentGraduation() {
  const studentId = Number(localStorage.getItem("studentId") || 1);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGradeCount();
  }, []);

  const loadGradeCount = async () => {
    try {
      const response = await fetch(apiUrl(`/grades/${studentId}`));
      if (response.ok) {
        const data = await response.json();
        const graded = (data.grades ?? []).filter(
         (g: any) => !["W", "I"].includes(g.letter_grade)
        );
        setCompletedCourses(graded.length);
      }
    } catch {
      toast.error("Could not load grade data.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const response = await fetch(apiUrl("/graduation/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Could not submit application.");
        return;
      }

      setApplied(true);
      toast.success("Graduation application submitted!");
    } catch {
      toast.error("Could not connect to backend.");
    } finally {
      setIsApplying(false);
    }
  };

  const eligible = completedCourses >= 8;

  if (loading) {
    return <div className="p-8 text-gray-600">Loading...</div>;
  }

  if (applied) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl text-gray-900 mb-2">Application Submitted</h2>
            <p className="text-gray-600">
              Your graduation application is pending registrar review.
              You will be notified of the decision.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Apply for Graduation</h1>
          <p className="text-gray-600">Submit your graduation application for registrar review</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-gray-900 font-semibold mb-4">Eligibility Check</h2>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <p className="text-gray-900 font-medium">Completed Courses</p>
              <p className="text-sm text-gray-600">Minimum 8 required for graduation</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${eligible ? "text-green-600" : "text-orange-600"}`}>
                {completedCourses} / 8
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${eligible ? "bg-green-500" : "bg-orange-400"}`}
              style={{ width: `${Math.min((completedCourses / 8) * 100, 100)}%` }}
            />
          </div>

          {eligible ? (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-900 font-medium">You are eligible to apply</p>
                <p className="text-sm text-green-700">
                  You have completed {completedCourses} courses. The registrar will verify that all
                  required courses are covered before approving your application.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-orange-900 font-medium">Not yet eligible</p>
                <p className="text-sm text-orange-700">
                  You need {8 - completedCourses} more completed course(s) to apply for graduation.
                  Applying before meeting this requirement will result in a warning.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-gray-900 font-semibold mb-3">What happens next</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
              <p className="text-gray-900 text-sm">You submit your graduation application</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
              <p className="text-gray-900 text-sm">The registrar reviews your completed courses</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
              <p className="text-gray-900 text-sm">If approved, you graduate with a Bachelor's degree</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">!</div>
              <p className="text-gray-900 text-sm">If rejected, you receive a warning for a reckless application</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={isApplying}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-colors ${
            isApplying
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          {isApplying ? "Submitting..." : "Submit Graduation Application"}
        </button>
      </div>
    </div>
  );
}
