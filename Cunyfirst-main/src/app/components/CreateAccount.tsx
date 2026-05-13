import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { GraduationCap, ArrowLeft, User, Eye, Briefcase, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  createAccount,
  isValidEmail,
  isValidUniversityEmail,
  validatePassword,
  usernameExists,
  emailExists,
} from "../utils/auth";

type AccountType = "student" | "guest" | "instructor-request";

export function CreateAccount() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    employeeId: "",
    department: "",
    universityEmail: "",
    justification: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const newErrors: { [key: string]: string } = {};

    // Common validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (emailExists(formData.email)) {
      newErrors.email = "This email is already registered";
    }

    // Guest account - no password required
    if (accountType === "guest") {
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        toast.error("Please fix the errors in the form");
        return;
      }

      toast.success("Guest account created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/guest-student");
      }, 1500);
      return;
    }

    // Student account validation
    if (accountType === "student") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      } else if (usernameExists(formData.username)) {
        newErrors.username = "This username is already taken";
      }

      if (!formData.studentId.trim()) {
        newErrors.studentId = "Student ID is required";
      } else if (formData.studentId.length < 6) {
        newErrors.studentId = "Student ID must be at least 6 characters";
      }
    }

    // Password validation for student accounts
    if (accountType === "student") {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) {
          newErrors.password = passwordValidation.message;
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // Instructor request validation
    if (accountType === "instructor-request") {
      if (!formData.universityEmail.trim()) {
        newErrors.universityEmail = "University email is required";
      } else if (!isValidUniversityEmail(formData.universityEmail)) {
        newErrors.universityEmail = "Must be a valid @cuny.edu email address";
      }

      if (!formData.employeeId.trim()) {
        newErrors.employeeId = "Employee ID is required";
      }

      if (!formData.department) {
        newErrors.department = "Please select a department";
      }

      // Instructor requests also need passwords
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else {
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) {
          newErrors.password = passwordValidation.message;
        }
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // Check for errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      toast.error("Please fix the errors in the form");
      return;
    }

    // Create student account
    if (accountType === "student") {
      const result = createAccount({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: "student",
        studentId: formData.studentId,
      });

      if (!result.success) {
        toast.error(result.message);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>Account created successfully! Redirecting to login...</span>
        </div>
      );

      setTimeout(() => {
        navigate("/?registered=true");
      }, 2000);
      return;
    }

    // Instructor access request
    if (accountType === "instructor-request") {
      // Store the instructor request (in a real app, this would go to a database)
      const instructorRequests = JSON.parse(
        localStorage.getItem("instructor_requests") || "[]"
      );
      instructorRequests.push({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        universityEmail: formData.universityEmail,
        employeeId: formData.employeeId,
        department: formData.department,
        justification: formData.justification,
        password: formData.password,
        submittedAt: new Date().toISOString(),
        status: "pending",
      });
      localStorage.setItem("instructor_requests", JSON.stringify(instructorRequests));

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>Instructor access request submitted! Redirecting...</span>
        </div>
      );

      setTimeout(() => {
        navigate("/pending-approval");
      }, 2000);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join the CUNYfirst Course Registration System</p>
          </div>

          {/* Account Type Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-3 font-medium">
              Account Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("student")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.01] ${
                  accountType === "student"
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <User className={`w-5 h-5 mt-0.5 ${accountType === "student" ? "text-blue-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <h3 className={`font-medium mb-1 ${accountType === "student" ? "text-blue-900" : "text-gray-900"}`}>
                      Student Account
                    </h3>
                    <p className="text-sm text-gray-600">
                      Register for courses, view schedules, and manage your academic profile
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("guest")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.01] ${
                  accountType === "guest"
                    ? "border-orange-500 bg-orange-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Eye className={`w-5 h-5 mt-0.5 ${accountType === "guest" ? "text-orange-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <h3 className={`font-medium mb-1 ${accountType === "guest" ? "text-orange-900" : "text-gray-900"}`}>
                      Guest Account
                    </h3>
                    <p className="text-sm text-gray-600">
                      View-only access to explore the portal without full registration
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("instructor-request")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.01] ${
                  accountType === "instructor-request"
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Briefcase className={`w-5 h-5 mt-0.5 ${accountType === "instructor-request" ? "text-green-600" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <h3 className={`font-medium mb-1 ${accountType === "instructor-request" ? "text-green-900" : "text-gray-900"}`}>
                      Request Instructor Access
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submit a request for instructor privileges (requires admin approval)
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Admin Notice */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-purple-900 font-medium mb-1">Registrar/Admin Accounts</p>
                <p className="text-sm text-purple-700">
                  Administrator accounts cannot be self-created. Contact the system administrator or IT department for admin access.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-sm text-gray-700 mb-2 font-medium">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                    errors.firstName ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm text-gray-700 mb-2 font-medium">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                    errors.lastName ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2 font-medium">
                {accountType === "guest" ? "Email Address" : "Personal Email Address"} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                  errors.email ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Student-specific fields */}
            {accountType === "student" && (
              <>
                <div>
                  <label htmlFor="studentId" className="block text-sm text-gray-700 mb-2 font-medium">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    value={formData.studentId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                      errors.studentId ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="12345678"
                  />
                  {errors.studentId && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.studentId}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm text-gray-700 mb-2 font-medium">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                      errors.username ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="johndoe"
                  />
                  {errors.username && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.username}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Instructor request fields */}
            {accountType === "instructor-request" && (
              <>
                <div>
                  <label htmlFor="universityEmail" className="block text-sm text-gray-700 mb-2 font-medium">
                    University Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="universityEmail"
                    name="universityEmail"
                    type="email"
                    value={formData.universityEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                      errors.universityEmail ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="john.doe@cuny.edu"
                  />
                  {errors.universityEmail ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.universityEmail}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Must be a valid @cuny.edu email address</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="employeeId" className="block text-sm text-gray-700 mb-2 font-medium">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="employeeId"
                      name="employeeId"
                      type="text"
                      value={formData.employeeId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                        errors.employeeId ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="EMP123456"
                    />
                    {errors.employeeId && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.employeeId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm text-gray-700 mb-2 font-medium">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                        errors.department ? "border-red-300" : "border-gray-200"
                      }`}
                    >
                      <option value="">Select Department</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Biology">Biology</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Physics">Physics</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                      <option value="Psychology">Psychology</option>
                      <option value="Business">Business</option>
                    </select>
                    {errors.department && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.department}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="justification" className="block text-sm text-gray-700 mb-2 font-medium">
                    Justification for Instructor Access
                  </label>
                  <textarea
                    id="justification"
                    name="justification"
                    value={formData.justification}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 resize-none"
                    placeholder="Briefly explain why you need instructor access..."
                  />
                </div>
              </>
            )}

            {/* Password fields - not for guest */}
            {accountType !== "guest" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="password" className="block text-sm text-gray-700 mb-2 font-medium">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                      errors.password ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.password ? (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Min 8 characters, 1 lowercase, 1 number</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-gray-700 mb-2 font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                      errors.confirmPassword ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg font-medium cursor-pointer transform hover:scale-[1.02] ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting
                  ? "Processing..."
                  : accountType === "instructor-request"
                  ? "Submit Request"
                  : accountType === "guest"
                  ? "Create Guest Account"
                  : "Create Student Account"}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
