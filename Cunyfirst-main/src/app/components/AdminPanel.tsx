import { useState } from "react";
import { Users, BookOpen, CheckCircle, Settings } from "lucide-react";

type TabType = "courses" | "students" | "approvals" | "settings";

export function RegistrarDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("courses");

  const tabs = [
    { id: "courses" as TabType, label: "Manage Courses", icon: BookOpen },
    { id: "students" as TabType, label: "Manage Students", icon: Users },
    { id: "approvals" as TabType, label: "Approvals", icon: CheckCircle },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

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

  const instructorRequests = [
    {
      id: "1",
      name: "Dr. Emily Chen",
      email: "emily.chen@example.com",
      universityEmail: "emily.chen@cuny.edu",
      employeeId: "EMP98765",
      department: "Computer Science",
      submittedDate: "2026-04-22",
      status: "Pending",
    },
    {
      id: "2",
      name: "Prof. Michael Roberts",
      email: "m.roberts@example.com",
      universityEmail: "m.roberts@cuny.edu",
      employeeId: "EMP87654",
      department: "Mathematics",
      submittedDate: "2026-04-21",
      status: "Pending",
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Registrar Admin Panel</h1>
          <p className="text-gray-600">Manage courses, students, and approvals</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

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
                {/* Instructor Access Requests */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-gray-900 text-lg font-semibold">Instructor Access Requests</h2>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      {instructorRequests.filter(r => r.status === "Pending").length} Pending
                    </span>
                  </div>
                  <div className="space-y-4">
                    {instructorRequests.map((request) => (
                      <div key={request.id} className="border-2 border-orange-200 bg-orange-50 rounded-lg p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-gray-900 font-semibold text-lg">{request.name}</h3>
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                {request.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600 mb-1">Employee ID</p>
                                <p className="text-gray-900 font-medium">{request.employeeId}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 mb-1">Department</p>
                                <p className="text-gray-900 font-medium">{request.department}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 mb-1">University Email</p>
                                <p className="text-gray-900 font-medium">{request.universityEmail}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 mb-1">Personal Email</p>
                                <p className="text-gray-900 font-medium">{request.email}</p>
                              </div>
                              <div>
                                <p className="text-gray-600 mb-1">Submitted Date</p>
                                <p className="text-gray-900 font-medium">{request.submittedDate}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {request.status === "Pending" && (
                          <div className="flex gap-3 pt-3 border-t border-orange-200">
                            <button className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                              Approve & Create Account
                            </button>
                            <button className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                              Deny Request
                            </button>
                            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                              Request More Info
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
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