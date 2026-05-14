import { useState } from "react";
import { Link } from "react-router";
import {
    GraduationCap,
    ArrowLeft,
    User,
    Briefcase,
    AlertCircle,
    CheckCircle,
    Upload,
} from "lucide-react";
import { toast } from "sonner";

import { apiUrl } from "../utils/api";

type ApplicationType = "student" | "instructor";

export function Register() {
    const [applicationType, setApplicationType] = useState<ApplicationType>("student");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        // student only
        gpa: "",
        transcript: null as File | null,
        // instructor only
        resume: null as File | null,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: "transcript" | "resume"
    ) => {
        const file = e.target.files?.[0] ?? null;
        setFormData((prev) => ({ ...prev, [field]: file }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validate = (): Record<string, string> => {
        const e: Record<string, string> = {};

        if (!formData.firstName.trim()) e.firstName = "First name is required";
        if (!formData.lastName.trim()) e.lastName = "Last name is required";
        if (!formData.email.trim()) {
            e.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            e.email = "Please enter a valid email address";
        }

        if (applicationType === "student") {
            if (!formData.gpa.trim()) {
                e.gpa = "GPA is required";
            } else {
                const gpaNum = parseFloat(formData.gpa);
                if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) {
                    e.gpa = "GPA must be a number between 0.0 and 4.0";
                }
            }
            if (!formData.transcript) {
                e.transcript = "Transcript is required";
            }
        }

        if (applicationType === "instructor") {
            if (!formData.resume) {
                e.resume = "Resume is required";
            }
        }

        return e;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Please fix the errors in the form");
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint =
                applicationType === "student"

                    ? apiUrl("/applications/student")
                    : apiUrl("/applications/instructor");


            const fd = new FormData();
            fd.append("first_name", formData.firstName);
            fd.append("last_name", formData.lastName);
            fd.append("email", formData.email);

            if (applicationType === "student") {
                fd.append("gpa", formData.gpa);
                if (formData.transcript) fd.append("transcript", formData.transcript);
            } else {
                if (formData.resume) fd.append("resume", formData.resume);
            }

            const response = await fetch(endpoint, { method: "POST", body: fd });
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || data.detail || "Submission failed");
                return;
            }

            toast.success(data.message || "Application submitted successfully");
            setSubmitted(true);
        } catch (err) {
            toast.error("Could not connect to server. Is the backend running?");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl text-gray-900 font-semibold mb-2">Application Submitted</h1>
                        <p className="text-gray-600 mb-2">
                            Your application has been received and is pending review by the registrar.
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            If approved, you will receive your login credentials at{" "}
                            <span className="font-medium text-gray-700">{formData.email}</span>.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────
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
                        <h1 className="text-4xl text-gray-900 mb-2">Apply to College0</h1>
                        <p className="text-gray-600">
                            Submit your application. The registrar will review and respond via email.
                        </p>
                    </div>

                    {/* Application type selector */}
                    <div className="mb-6">
                        <label className="block text-sm text-gray-700 mb-3 font-medium">
                            I am applying as a <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setApplicationType("student")}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                                    applicationType === "student"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <User
                                        className={`w-5 h-5 ${
                                            applicationType === "student" ? "text-blue-600" : "text-gray-400"
                                        }`}
                                    />
                                    <div>
                                        <p
                                            className={`font-medium ${
                                                applicationType === "student" ? "text-blue-900" : "text-gray-900"
                                            }`}
                                        >
                                            Student
                                        </p>
                                        <p className="text-xs text-gray-500">Enroll in courses</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setApplicationType("instructor")}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
                                    applicationType === "instructor"
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Briefcase
                                        className={`w-5 h-5 ${
                                            applicationType === "instructor" ? "text-green-600" : "text-gray-400"
                                        }`}
                                    />
                                    <div>
                                        <p
                                            className={`font-medium ${
                                                applicationType === "instructor" ? "text-green-900" : "text-gray-900"
                                            }`}
                                        >
                                            Instructor
                                        </p>
                                        <p className="text-xs text-gray-500">Teach courses</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Info banner */}
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                {applicationType === "student"
                                    ? "Student applications are reviewed by the registrar."
                                    : "Instructor applications are reviewed and approved or rejected by the registrar at their discretion."}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
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
                                    placeholder="John"
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.firstName ? "border-red-300" : "border-gray-200"
                                    }`}
                                />
                                {errors.firstName && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.firstName}
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
                                    placeholder="Doe"
                                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.lastName ? "border-red-300" : "border-gray-200"
                                    }`}
                                />
                                {errors.lastName && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm text-gray-700 mb-2 font-medium">
                                Personal Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john.doe@example.com"
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                    errors.email ? "border-red-300" : "border-gray-200"
                                }`}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Student-only fields */}
                        {applicationType === "student" && (
                            <>
                                <div>
                                    <label htmlFor="gpa" className="block text-sm text-gray-700 mb-2 font-medium">
                                        GPA <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="gpa"
                                        name="gpa"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="4.0"
                                        value={formData.gpa}
                                        onChange={handleChange}
                                        placeholder="3.50"
                                        className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                            errors.gpa ? "border-red-300" : "border-gray-200"
                                        }`}
                                    />
                                    {errors.gpa ? (
                                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {errors.gpa}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">Enter your cumulative GPA on a 4.0 scale</p>
                                    )}
                                </div>

                                <FileUploadField
                                    id="transcript"
                                    label="Transcript"
                                    accept=".pdf"
                                    file={formData.transcript}
                                    error={errors.transcript}
                                    placeholder="Upload transcript (PDF)"
                                    onChange={(e) => handleFileChange(e, "transcript")}
                                />
                            </>
                        )}

                        {/* Instructor-only fields */}
                        {applicationType === "instructor" && (
                            <FileUploadField
                                id="resume"
                                label="Resume"
                                accept=".pdf"
                                file={formData.resume}
                                error={errors.resume}
                                placeholder="Upload resume (PDF)"
                                onChange={(e) => handleFileChange(e, "resume")}
                            />
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg font-medium cursor-pointer transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Application"}
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

// ── Reusable file-upload field ────────────────────────────────────────────────
function FileUploadField({
                             id,
                             label,
                             accept,
                             file,
                             error,
                             placeholder,
                             onChange,
                         }: {
    id: string;
    label: string;
    accept: string;
    file: File | null;
    error?: string;
    placeholder: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
                {label} <span className="text-red-500">*</span>
            </label>
            <label
                htmlFor={id}
                className={`flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border rounded-lg cursor-pointer hover:bg-gray-100 transition-all ${
                    error ? "border-red-300" : "border-gray-200"
                }`}
            >
                <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className={`text-sm truncate ${file ? "text-gray-800" : "text-gray-400"}`}>
          {file ? file.name : placeholder}
        </span>
                <input id={id} type="file" accept={accept} className="hidden" onChange={onChange} />
            </label>
            {error && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                </p>
            )}
        </div>
    );
}
