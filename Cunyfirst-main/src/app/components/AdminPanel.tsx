import { useEffect, useState } from "react";
import { RefreshCw, XCircle, Bot } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router";
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

type Complaint = {
  complaint_id: number;
  complainant_id: number;
  complainant_role: string;
  target_id: number;
  description: string;
  status: "Pending" | "Resolved";
  created_at: string;
};

type GraduationApplication = {
  application_id: number;
  student_id: number;
  status: "Pending" | "Approved" | "Rejected";
  applied_at: string;
};

type ManagedCourse = {
  id: string;
  code: string;
  name: string;
  sections: number;
  enrolled: number;
  capacity: number;
};

type ManagedStudent = {
  id: string;
  name: string;
  studentId: string;
  email: string;
  credits: number;
  status: string;
};

export function RegistrarDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [reviewInputs, setReviewInputs] = useState<Record<number, ReviewInput>>({});
  const [processingApplicationId, setProcessingApplicationId] = useState<number | null>(null);
  const [approvalResults, setApprovalResults] = useState<Record<number, ApprovalResult>>({});
  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [complaintActions, setComplaintActions] = useState<Record<number, { action: string; justification: string }>>({});
  const [processingComplaintId, setProcessingComplaintId] = useState<number | null>(null);

  // Graduation state
  const [graduationApps, setGraduationApps] = useState<GraduationApplication[]>([]);
  const [isLoadingGraduation, setIsLoadingGraduation] = useState(false);
  const [graduationJustifications, setGraduationJustifications] = useState<Record<number, string>>({});
  const [processingGraduationId, setProcessingGraduationId] = useState<number | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState("registration");
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [runningMaintenance, setRunningMaintenance] = useState<string | null>(null);

  const requestedTab = searchParams.get("tab");
  const activeTab: TabType =
    requestedTab === "students" || requestedTab === "approvals" || requestedTab === "settings"
      ? requestedTab
      : "courses";

  const approvals = [
    { id: "1", student: "John Smith", course: "CS 501", type: "Override", status: "Pending" },
    { id: "2", student: "Sarah Johnson", course: "MATH 401", type: "Prerequisite", status: "Pending" },
    { id: "3", student: "Mike Davis", course: "CS 301", type: "Waitlist", status: "Approved" },
  ];

  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    setApplicationError("");

    try {
      const response = await fetch(apiUrl("/applications?status=Pending"));
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

  const fetchManagedCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const [coursesResponse, sectionsResponse, enrollmentsResponse] = await Promise.all([
        fetch(apiUrl("/courses")),
        fetch(apiUrl("/sections")),
        fetch(apiUrl("/registration/enrollments")),
      ]);

      const coursesData = coursesResponse.ok ? await coursesResponse.json() : [];
      const sectionsData = sectionsResponse.ok ? await sectionsResponse.json() : [];
      const enrollmentsData = enrollmentsResponse.ok ? await enrollmentsResponse.json() : [];

      setCourses((coursesData ?? []).map((course: any) => {
        const courseSections = (sectionsData ?? []).filter((section: any) => section.course_id === course.course_id);
        const courseEnrollments = (enrollmentsData ?? []).filter((enrollment: any) =>
          (enrollment.status ?? "enrolled") === "enrolled" &&
          enrollment.section?.course_id === course.course_id
        );

        return {
          id: String(course.course_id),
          code: course.course_code,
          name: course.course_name,
          sections: courseSections.length,
          enrolled: courseEnrollments.length,
          capacity: courseSections.reduce((total: number, section: any) => total + Number(section.seats ?? 0), 0),
        };
      }));
    } catch {
      toast.error("Could not load course management data.");
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const fetchManagedStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const [studentsResponse, enrollmentsResponse] = await Promise.all([
        fetch(apiUrl("/students")),
        fetch(apiUrl("/registration/enrollments")),
      ]);

      const studentsData = studentsResponse.ok ? await studentsResponse.json() : { students: [] };
      const enrollmentsData = enrollmentsResponse.ok ? await enrollmentsResponse.json() : [];

      setStudents((studentsData.students ?? []).map((student: any) => {
        const account = student.account ?? student;
        const studentId = student.student_id ?? account.user_id;
        const studentEnrollments = (enrollmentsData ?? []).filter((enrollment: any) =>
          enrollment.student_id === studentId && (enrollment.status ?? "enrolled") === "enrolled"
        );
        const credits = studentEnrollments.reduce((total: number, enrollment: any) =>
          total + Number(enrollment.section?.course?.credits ?? 0), 0);
        const name = [account.first_name, account.last_name].filter(Boolean).join(" ");

        return {
          id: String(studentId),
          studentId: `STU${String(studentId).padStart(3, "0")}`,
          name: name || account.email || `Student ${studentId}`,
          email: account.email || "Email unavailable",
          credits,
          status: student.is_active === false ? "Inactive" : (student.academic_standing || "Active"),
        };
      }));
    } catch {
      toast.error("Could not load student management data.");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const response = await fetch(apiUrl("/complaints/pending"));
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints ?? []);
      }
    } catch {
      toast.error("Could not load complaints.");
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  const fetchGraduationApps = async () => {
    setIsLoadingGraduation(true);
    try {
      const response = await fetch(apiUrl("/graduation/pending"));
      if (response.ok) {
        const data = await response.json();
        setGraduationApps(data.applications ?? []);
      }
    } catch {
      toast.error("Could not load graduation applications.");
    } finally {
      setIsLoadingGraduation(false);
    }
  };

  useEffect(() => {
    if (activeTab === "approvals") {
      fetchApplications();
      fetchComplaints();
      fetchGraduationApps();
    } else if (activeTab === "courses") {
      fetchManagedCourses();
    } else if (activeTab === "students") {
      fetchManagedStudents();
    }
  }, [activeTab]);

  const getRegistrarId = () => {
    const registrarId = localStorage.getItem("registrarId");
    return registrarId ? Number(registrarId) : undefined;
  };

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
      setApplications((current) =>
        current.filter((item) => item.admission_id !== application.admission_id)
      );
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
      setApplications((current) =>
        current.filter((item) => item.admission_id !== application.admission_id)
      );
      await fetchApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application rejection failed.");
    } finally {
      setProcessingApplicationId(null);
    }
  };

  const handleResolveComplaint = async (complaintId: number) => {
    const input = complaintActions[complaintId];
    if (!input?.action) {
      toast.error("Please select an action.");
      return;
    }

    setProcessingComplaintId(complaintId);
    try {
      const response = await fetch(apiUrl(`/complaints/${complaintId}/resolve`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrar_id: getRegistrarId(),
          action: input.action,
          justification: input.justification || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Could not resolve complaint.");
        return;
      }

      toast.success("Complaint resolved.");
      fetchComplaints();
    } catch {
      toast.error("Could not connect to backend.");
    } finally {
      setProcessingComplaintId(null);
    }
  };

  const handleReviewGraduation = async (applicationId: number, approved: boolean) => {
    setProcessingGraduationId(applicationId);
    try {
      const response = await fetch(apiUrl(`/graduation/${applicationId}/review`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrar_id: getRegistrarId(),
          approved,
          justification: graduationJustifications[applicationId] || "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Could not process graduation application.");
        return;
      }

      toast.success(approved ? "Student graduated successfully." : "Application rejected.");
      fetchGraduationApps();
    } catch {
      toast.error("Could not connect to backend.");
    } finally {
      setProcessingGraduationId(null);
    }
  };

  const updateRegistrationPeriod = async () => {
    setIsSavingPeriod(true);
    try {
      const response = await fetch(apiUrl("/registration/period"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: currentPeriod }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Could not update registration period.");
        return;
      }

      toast.success(data.message || "Registration period updated.");
    } catch {
      toast.error("Could not connect to backend.");
    } finally {
      setIsSavingPeriod(false);
    }
  };

  const runMaintenanceAction = async (path: string, label: string) => {
    setRunningMaintenance(path);
    try {
      const response = await fetch(apiUrl(path), { method: "POST" });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        toast.error(data.message || `${label} failed.`);
        return;
      }

      toast.success(data.message || `${label} completed.`);
    } catch {
      toast.error("Could not connect to backend.");
    } finally {
      setRunningMaintenance(null);
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
            <button
               onClick={() => navigate("/registrar/ai-advisor")}
                className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2">
                   <Bot className="w-4 h-4" />
                   Open AI Advisor
                      </button>

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
                      {isLoadingCourses && (
                        <tr>
                          <td colSpan={6} className="px-6 py-6 text-center text-gray-600">Loading courses from backend...</td>
                        </tr>
                      )}
                      {!isLoadingCourses && courses.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-6 text-center text-gray-600">No courses found.</td>
                        </tr>
                      )}
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">{course.code}</td>
                          <td className="px-6 py-4 text-gray-900">{course.name}</td>
                          <td className="px-6 py-4 text-gray-600">{course.sections}</td>
                          <td className="px-6 py-4 text-gray-600">{course.enrolled}</td>
                          <td className="px-6 py-4 text-gray-600">{course.capacity}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">Edit</button>
                              <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors">Delete</button>
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
                      {isLoadingStudents && (
                        <tr>
                          <td colSpan={6} className="px-6 py-6 text-center text-gray-600">Loading students from backend...</td>
                        </tr>
                      )}
                      {!isLoadingStudents && students.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-6 text-center text-gray-600">No students found.</td>
                        </tr>
                      )}
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-900">{student.studentId}</td>
                          <td className="px-6 py-4 text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 text-gray-600">{student.email}</td>
                          <td className="px-6 py-4 text-gray-600">{student.credits}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${student.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">View</button>
                              <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">Edit</button>
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
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">Loading applications...</div>
                    )}
                    {!isLoadingApplications && applications.length === 0 && (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">No admission applications found.</div>
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
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${application.status === "Pending" ? "bg-yellow-100 text-yellow-700" : application.status === "Accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
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
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${approval.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                              {approval.status}
                            </span>
                            {approval.status === "Pending" && (
                              <div className="flex gap-2">
                                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Approve</button>
                                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Deny</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complaints */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-gray-900 text-lg font-semibold">Complaints</h2>
                      <p className="text-sm text-gray-600">Review and resolve pending complaints from students and instructors.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {complaints.filter(c => c.status === "Pending").length} Pending
                      </span>
                      <button
                        onClick={fetchComplaints}
                        disabled={isLoadingComplaints}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingComplaints ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isLoadingComplaints && (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">Loading complaints...</div>
                    )}
                    {!isLoadingComplaints && complaints.length === 0 && (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">No pending complaints.</div>
                    )}
                    {complaints.map((complaint) => {
                      const input = complaintActions[complaint.complaint_id] ?? { action: "", justification: "" };
                      const isProcessing = processingComplaintId === complaint.complaint_id;

                      return (
                        <div key={complaint.complaint_id} className="border border-gray-200 bg-white rounded-lg p-5">
                          <div className="mb-3">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">{complaint.status}</span>
                              <span className="text-sm text-gray-500">{new Date(complaint.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">From:</span> Account #{complaint.complainant_id} ({complaint.complainant_role})
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Against:</span> Account #{complaint.target_id}
                            </p>
                            <p className="text-gray-900">{complaint.description}</p>
                          </div>

                          {complaint.status === "Pending" && (
                            <div className="pt-3 border-t border-gray-200 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1 font-medium">Action</label>
                                  <select
                                    value={input.action}
                                    onChange={(e) => setComplaintActions(prev => ({ ...prev, [complaint.complaint_id]: { ...input, action: e.target.value } }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select action...</option>
                                    <option value="warn_subject">Warn Subject</option>
                                    <option value="warn_complainant">Warn Complainant (false complaint)</option>
                                    <option value="dismiss">Dismiss</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-700 mb-1 font-medium">Justification</label>
                                  <input
                                    type="text"
                                    value={input.justification}
                                    onChange={(e) => setComplaintActions(prev => ({ ...prev, [complaint.complaint_id]: { ...input, justification: e.target.value } }))}
                                    placeholder="Reason for decision"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleResolveComplaint(complaint.complaint_id)}
                                disabled={isProcessing}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
                              >
                                {isProcessing ? "Resolving..." : "Resolve Complaint"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Graduation Applications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-gray-900 text-lg font-semibold">Graduation Applications</h2>
                      <p className="text-sm text-gray-600">Review student graduation applications and verify required courses.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {graduationApps.filter(g => g.status === "Pending").length} Pending
                      </span>
                      <button
                        onClick={fetchGraduationApps}
                        disabled={isLoadingGraduation}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingGraduation ? "animate-spin" : ""}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isLoadingGraduation && (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">Loading graduation applications...</div>
                    )}
                    {!isLoadingGraduation && graduationApps.length === 0 && (
                      <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-600">No pending graduation applications.</div>
                    )}
                    {graduationApps.map((app) => {
                      const isProcessing = processingGraduationId === app.application_id;

                      return (
                        <div key={app.application_id} className="border border-gray-200 bg-white rounded-lg p-5">
                          <div className="mb-3">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">{app.status}</span>
                              <span className="text-sm text-gray-500">{new Date(app.applied_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Student ID:</span> {app.student_id}
                            </p>
                          </div>

                          {app.status === "Pending" && (
                            <div className="pt-3 border-t border-gray-200 space-y-3">
                              <div>
                                <label className="block text-sm text-gray-700 mb-1 font-medium">Justification (required if rejecting)</label>
                                <input
                                  type="text"
                                  value={graduationJustifications[app.application_id] ?? ""}
                                  onChange={(e) => setGraduationJustifications(prev => ({ ...prev, [app.application_id]: e.target.value }))}
                                  placeholder="Reason if rejecting..."
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleReviewGraduation(app.application_id, true)}
                                  disabled={isProcessing}
                                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-60"
                                >
                                  {isProcessing ? "Processing..." : "Approve — Graduate Student"}
                                </button>
                                <button
                                  onClick={() => handleReviewGraduation(app.application_id, false)}
                                  disabled={isProcessing}
                                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
                                >
                                  {isProcessing ? "Processing..." : "Reject Application"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                      <label className="block">
                        <span className="block text-sm text-gray-700 mb-2">Current Period</span>
                        <select
                          value={currentPeriod}
                          onChange={(event) => setCurrentPeriod(event.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="class_setup">Class Setup</option>
                          <option value="registration">Registration</option>
                          <option value="class_running">Class Running</option>
                          <option value="grading">Grading</option>
                          <option value="special_registration">Special Registration</option>
                        </select>
                      </label>
                      <button
                        onClick={updateRegistrationPeriod}
                        disabled={isSavingPeriod}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                      >
                        {isSavingPeriod ? "Saving..." : "Save Period"}
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-gray-900 mb-4">Registration Maintenance</h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => runMaintenanceAction("/registration/cancel-low-enrollment", "Low-enrollment cancellation")}
                        disabled={Boolean(runningMaintenance)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60"
                      >
                        {runningMaintenance === "/registration/cancel-low-enrollment" ? "Running..." : "Cancel Low Enrollment"}
                      </button>
                      <button
                        onClick={() => runMaintenanceAction("/registration/warn-low-load", "Low-load warning")}
                        disabled={Boolean(runningMaintenance)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-60"
                      >
                        {runningMaintenance === "/registration/warn-low-load" ? "Running..." : "Warn Low Course Load"}
                      </button>
                      <button
                        onClick={() => runMaintenanceAction("/registration/suspend-cancelled-instructors", "Instructor suspension check")}
                        disabled={Boolean(runningMaintenance)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                      >
                        {runningMaintenance === "/registration/suspend-cancelled-instructors" ? "Running..." : "Suspend Cancelled Instructors"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
