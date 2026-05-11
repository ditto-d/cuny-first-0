import { useState } from "react";
import { BookOpen, Users, FileText, Megaphone, Search } from "lucide-react";

type TabType = "courses" | "rosters" | "grades" | "announcements";

export function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("courses");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const courses = [
    { id: "1", code: "CS 101", name: "Introduction to Computer Science", section: "001", enrolled: 28, capacity: 30, schedule: "MWF 9:00-10:00 AM" },
    { id: "2", code: "CS 201", name: "Data Structures and Algorithms", section: "002", enrolled: 25, capacity: 30, schedule: "TTh 2:00-3:30 PM" },
    { id: "3", code: "CS 301", name: "Database Systems", section: "001", enrolled: 22, capacity: 25, schedule: "MWF 11:00-12:00 PM" },
  ];

  const students = [
    { id: "1", name: "John Smith", studentId: "STU001", email: "john@university.edu", grade: "A" },
    { id: "2", name: "Sarah Johnson", studentId: "STU002", email: "sarah@university.edu", grade: "B+" },
    { id: "3", name: "Mike Davis", studentId: "STU003", email: "mike@university.edu", grade: "A-" },
    { id: "4", name: "Emma Wilson", studentId: "STU004", email: "emma@university.edu", grade: "B" },
    { id: "5", name: "David Lee", studentId: "STU005", email: "david@university.edu", grade: "A" },
  ];

  const announcements = [
    { id: "1", title: "Midterm Exam Schedule", date: "2026-04-20", course: "CS 101", content: "Midterm exam will be held on May 15th" },
    { id: "2", title: "Office Hours Change", date: "2026-04-18", course: "CS 201", content: "Office hours moved to Thursday 3-5 PM" },
    { id: "3", title: "Assignment 3 Posted", date: "2026-04-15", course: "CS 301", content: "New assignment available on the portal" },
  ];

  const tabs = [
    { id: "courses" as TabType, label: "My Courses", icon: BookOpen },
    { id: "rosters" as TabType, label: "Student Rosters", icon: Users },
    { id: "grades" as TabType, label: "Grade Submission", icon: FileText },
    { id: "announcements" as TabType, label: "Announcements", icon: Megaphone },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Instructor Dashboard</h1>
          <p className="text-gray-600">Manage your courses and students</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Courses</p>
                <p className="text-3xl text-blue-600">{courses.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Students</p>
                <p className="text-3xl text-green-600">75</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Grades</p>
                <p className="text-3xl text-orange-600">12</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
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
                  <h2 className="text-gray-900">My Courses - Spring 2026</h2>
                </div>
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
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Enrolled</span>
                          <span className="text-gray-900">{course.enrolled}/{course.capacity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(course.enrolled / course.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        View Course
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "rosters" && (
              <div>
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-2">Select Course</label>
                  <select
                    value={selectedCourse || ""}
                    onChange={(e) => setSelectedCourse(e.target.value)}
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

                {selectedCourse && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-gray-900">Student Roster</h2>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Export to CSV
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Student ID</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Name</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Email</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-900">{student.studentId}</td>
                              <td className="px-6 py-4 text-gray-900">{student.name}</td>
                              <td className="px-6 py-4 text-gray-600">{student.email}</td>
                              <td className="px-6 py-4">
                                <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "grades" && (
              <div>
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-2">Select Course</label>
                  <select
                    value={selectedCourse || ""}
                    onChange={(e) => setSelectedCourse(e.target.value)}
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

                {selectedCourse && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-gray-900">Grade Submission</h2>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Submit All Grades
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Student ID</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Name</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Current Grade</th>
                            <th className="px-6 py-3 text-left text-sm text-gray-700">Final Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-900">{student.studentId}</td>
                              <td className="px-6 py-4 text-gray-900">{student.name}</td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                  {student.grade}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <option value="">Select Grade</option>
                                  <option value="A">A</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B">B</option>
                                  <option value="B-">B-</option>
                                  <option value="C+">C+</option>
                                  <option value="C">C</option>
                                  <option value="C-">C-</option>
                                  <option value="D">D</option>
                                  <option value="F">F</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                            <span>•</span>
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
