import { useEffect, useState } from "react";
import { RefreshCw, XCircle } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { apiUrl, readApiError } from "../utils/api";

type TabType = "courses" | "students" | "approvals" | "settings";

type AdmissionApplication = {
  admission_id: number;
  application_type?: "student" | "instructor" | null;
  first_name?: string | null;
  last_name?: string | null;
  applicant_name: string;
  email: string;
  gpa?: number | null;
  document_name?: string | null;
  status: "Pending" | "Accepted" | "Rejected" | "Waitlisted";
  submitted_at?: string | null;
  review_justification?: string | null;
};

type ReviewInput = {
  applicationType?: "student" | "instructor";
  programId?: string;
  departmentId?: string;
  justification?: string;
};

type ApprovalResult = {
  username?: string;
  temporaryPassword?: string;
};

export function RegistrarDashboard() {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [reviewInputs, setReviewInputs] = useState<Record<number, ReviewInput>>({});
  const [processingApplicationId, setProcessingApplicationId] = useState<number | null>(null);
  const [approvalResults, setApprovalResults] = useState<Record<number, ApprovalResult>>({});

  const requestedTab = searchParams.get("tab");
  const activeTab: TabType =
    requestedTab === "students" || requestedTab === "approvals" || requestedTab === "settings"
      ? requestedTab
      : "courses";

  const courses = [
    { id: "1", code: "CS 101", name: "Intro to CS", sections: 3, enrolled: 85, capacity: 90 },
    { id: "2", code: "CS 201", name: "Data Structures", sections: 2, enrolled: 58, capacity: 60 },
    { id: "3", code: "CS 301", name: "Database Systems", sections: 2, enrolled: 45, capacity: 50 },
    { id: "4", code: "CS 401", name: "Machine Learning", sections: 1, enrolled: 30, capacity: 30 },
  ];

  const students = [
    { id: "1", name: "John Smith", studentId: "STU001", email: "john@university.edu", credits: 15, status: "Active" },
    { id: "2", name: "Sarah Johnson", studentId: "STU002", email: "sarah@university.edu", credits: 12, status: "Active" },
    { id: "3", name: "Mike Davis", studentId: "STU003", email: "mike@university.edu", credits: 18, status: "Active" },
    { id: "4", name: "Emma Wilson", studentId: "STU004", email: "emma@university.edu", credits: 9, status: "Hold" },
  ];

  const approvals = [
    { id: "1", student: "John Smith", course: "CS 501", type: "Override", status: "Pending" },
    { id: "2", student: "Sarah Johnson", course: "MATH 401", type: "Prerequisite", status: "Pending" },
    { id: "3", student: "Mike Davis", course: "CS 301", type: "Waitlist", status: "Approved" },
  ];

  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    setApplicationError("");

    try {
      const response = await fetch(apiUrl("/applications"));
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not load applications."));
      }

      const data = await response.json();
      setApplications(data.applications ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load applications.";
      setApplicationError(message);
      toast.error(message);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (activeTab === "approvals") {
      fetchApplications();
    }
  }, [activeTab]);

  const updateReviewInput = (admissionId: number, values: ReviewInput) => {
    setReviewInputs((current) => ({
      ...current,
      [admissionId]: {
        ...current[admissionId],
        ...values,
      },
    }));
  };

  const getReviewInput = (application: AdmissionApplication) => {
    const savedInput = reviewInputs[application.admission_id] ?? {};
    const inferredType = application.application_type ?? (application.gpa !== null && application.gpa !== undefined ? "student" : "instructor");

    return {
      applicationType: savedInput.applicationType ?? inferredType,
      programId: savedInput.programId ?? "",
      departmentId: savedInput.departmentId ?? "",
      justification: savedInput.justification ?? "",
    };
  };

  const getRegistrarId = () => {
    const registrarId = localStorage.getItem("registrarId");
    return registrarId ? Number(registrarId) : undefined;
  };

  const approveApplication = async (application: AdmissionApplication) => {
    const input = getReviewInput(application);
    setProcessingApplicationId(application.admission_id);

    try {
      const payload = {
        registrar_id: getRegistrarId(),
        application_type: input.applicationType,
        program_id: input.applicationType === "student" && input.programId ? Number(input.programId) : undefined,
        department_id: input.applicationType === "instructor" && input.departmentId ? Number(input.departmentId) : undefined,
        override_justification: input.justification || undefined,
      };

      const response = await fetch(apiUrl(`/applications/${application.admission_id}/approve`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Application approval failed.");
      }

      setApprovalResults((current) => ({
        ...current,
        [application.admission_id]: {
          username: data.account?.username,
          temporaryPassword: data.temporary_password,
        },
      }));
      toast.success("Application approved and account created.");
      await fetchApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application approval failed.");
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const rejectApplication = async (application: AdmissionApplication) => {
    const input = getReviewInput(application);
    setProcessingApplicationId(application.admission_id);

    try {
      const payload = {
        registrar_id: getRegistrarId(),
        application_type: input.applicationType,
        program_id: input.applicationType === "student" && input.programId ? Number(input.programId) : undefined,
        justification: input.justification || undefined,
      };

      const response = await fetch(apiUrl(`/applications/${application.admission_id}/reject`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Application rejection failed.");
      }

      toast.success("Application rejected.");
      await fetchApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application rejection failed.");
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const pendingApplications = applications.filter((application) => application.status === "Pending").length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Registrar Admin Panel</h1>
          <p className="text-gray-600">Manage courses, students, and approvals</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            {activeTab === "courses" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-gray-900">Course Management</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add New Course
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Course Code</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Course Name</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Sections</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Enrolled</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Capacity</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">{course.code}</td>
                          <td className="px-6 py-4 text-gray-900">{course.name}</td>
                          <td className="px-6 py-4 text-gray-600">{course.sections}</td>
                          <td className="px-6 py-4 text-gray-600">{course.enrolled}</td>
                          <td className="px-6 py-4 text-gray-600">{course.capacity}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                Edit
                              </button>
                              <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "students" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-gray-900">Student Management</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add New Student
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Student ID</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Name</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Email</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Credits</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
                        <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">{student.studentId}</td>
                          <td className="px-6 py-4 text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 text-gray-600">{student.email}</td>
                          <td className="px-6 py-4 text-gray-600">{student.credits}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              student.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                View
                              </button>
                              <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "approvals" && (
              <div className="space-y-8">
                {/* Admission Applications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-gray-900 text-lg font-semibold">Admission Applications</h2>
                      <p className="text-sm text-gray-600">Review student and instructor applications, then create approved accounts.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        {pendingApplications} Pending
                      </span>
                      <button
                        onClick={fetchApplications}
                        disabled={isLoadingApplications}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingApplications ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {applicationError && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      <XCircle className="w-4 h-4" />
                      {applicationError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {isLoadingApplications && applications.length === 0 && (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                        Loading applications...
                      </div>
                    )}

                    {!isLoadingApplications && applications.length === 0 && (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">
                        No admission applications found.
                      </div>
                    )}

                    {applications.map((application) => {
                      const input = getReviewInput(application);
                      const isPending = application.status === "Pending";
                      const isProcessing = processingApplicationId === application.admission_id;
                      const result = approvalResults[application.admission_id];

                      return (
                        <div key={application.admission_id} className="border border-gray-200 bg-white rounded-lg p-5">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-gray-900 font-semibold text-lg">{application.applicant_name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  application.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : application.status === "Accepted"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {application.status}
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                                  {input.applicationType}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-600 mb-1">Email</p>
                                  <p className="text-gray-900 font-medium break-all">{application.email}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">GPA</p>
                                  <p className="text-gray-900 font-medium">{application.gpa ?? "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">Document</p>
                                  <p className="text-gray-900 font-medium">{application.document_name ?? "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600 mb-1">Submitted</p>
                                  <p className="text-gray-900 font-medium">
                                    {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {result && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                              <p className="font-medium mb-1">Account created</p>
                              <p>Username/email: {result.username || application.email}</p>
                              {result.temporaryPassword && <p>Temporary password: {result.temporaryPassword}</p>}
                            </div>
                          )}

                          {isPending && (
                            <div className="pt-4 border-t border-gray-200 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {!application.application_type && (
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-2 font-medium">Application Type</label>
                                    <select
                                      value={input.applicationType}
                                      onChange={(event) => updateReviewInput(application.admission_id, { applicationType: event.target.value as "student" | "instructor" })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="student">Student</option>
                                      <option value="instructor">Instructor</option>
                                    </select>
                                  </div>
                                )}

                                {input.applicationType === "student" ? (
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-2 font-medium">Program ID</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={input.programId}
                                      onChange={(event) => updateReviewInput(application.admission_id, { programId: event.target.value })}
                                      placeholder="Optional"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-sm text-gray-700 mb-2 font-medium">Department ID</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={input.departmentId}
                                      onChange={(event) => updateReviewInput(application.admission_id, { departmentId: event.target.value })}
                                      placeholder="Required"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}

                                <div className="md:col-span-2">
                                  <label className="block text-sm text-gray-700 mb-2 font-medium">Justification</label>
                                  <input
                                    type="text"
                                    value={input.justification}
                                    onChange={(event) => updateReviewInput(application.admission_id, { justification: event.target.value })}
                                    placeholder="Required for override approvals or eligible student rejections"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <button
                                  onClick={() => approveApplication(application)}
                                  disabled={isProcessing}
                                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-60"
                                >
                                  {isProcessing ? "Processing..." : "Approve & Create Account"}
                                </button>
                                <button
                                  onClick={() => rejectApplication(application)}
                                  disabled={isProcessing}
                                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
                                >
                                  {isProcessing ? "Processing..." : "Deny Application"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Course Registration Approvals */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-gray-900 text-lg font-semibold">Course Registration Approvals</h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {approvals.filter(a => a.status === "Pending").length} Pending
                    </span>
                  </div>
                  <div className="space-y-4">
                    {approvals.map((approval) => (
                      <div key={approval.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-900 mb-1 font-medium">{approval.student}</p>
                            <p className="text-sm text-gray-600">{approval.course} - {approval.type} Request</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              approval.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}>
                              {approval.status}
                            </span>
                            {approval.status === "Pending" && (
                              <div className="flex gap-2">
                                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                  Approve
                                </button>
                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                  Deny
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h2 className="text-gray-900 mb-6">System Settings</h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-gray-900 mb-4">Registration Period</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Start Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue="2026-04-15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">End Date</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue="2026-05-01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-gray-900 mb-4">Credit Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Minimum Credits</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue="12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Maximum Credits</label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue="18"
                        />
                      </div>
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
