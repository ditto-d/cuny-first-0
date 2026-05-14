import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { GraduationCap, X, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { apiUrl } from "../utils/api";


export function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showRegisteredMessage, setShowRegisteredMessage] = useState(false);

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setShowRegisteredMessage(true);
            toast.success("Account created successfully! You can now log in.");
            setTimeout(() => {
                window.history.replaceState({}, "", "/");
            }, 100);
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username || !password) {
            setError("Please enter both username and password");
            toast.error("Please enter both username and password");
            return;
        }

        setIsLoading(true);
        try {

            const response = await fetch(apiUrl("/auth/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: username, password }),
            });


    const data = await response.json();


            if (!response.ok) {
                const message = data.message || data.detail || "Login failed.";
                setError(message);
                toast.error(message);
                return;
            }


            // Store token and user info
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("username", data.user.first_name || data.user.email);
            localStorage.setItem("userRole", data.user.role);
            localStorage.setItem("userEmail", data.user.email);
            if (data.user.student_id) localStorage.setItem("studentId", String(data.user.student_id));
            if (data.user.instructor_id) localStorage.setItem("instructorId", String(data.user.instructor_id));
            if (data.user.registrar_id) localStorage.setItem("registrarId", String(data.user.registrar_id));

            const displayName = [data.user.first_name, data.user.last_name].filter(Boolean).join(" ") || data.user.email;
            toast.success(`Welcome back, ${displayName}!`);

            // Navigate based on role
            if (data.user.role === "registrar") {
                navigate("/registrar");
            } else if (data.user.role === "instructor") {
                navigate("/instructor");
            } else {
                navigate("/student");
            }
        } catch (err) {
            setError("Could not connect to server.");
            toast.error("Could not connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = (role: string) => {
        setShowGuestModal(false);
        toast.info("You are now in guest mode with view-only access");
        navigate(`/${role}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                            <GraduationCap className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl text-gray-900 mb-2">CUNYfirst</h1>
                        <p className="text-gray-600">Course Registration System</p>
                    </div>

                    {/* Success Message Banner - Account Created */}
                    {showRegisteredMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-in fade-in duration-300">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-green-900 font-medium mb-1">
                                        Account Created Successfully!
                                    </p>
                                    <p className="text-sm text-green-700">
                                        Please log in with your new credentials.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowRegisteredMessage(false)}
                                    className="text-green-600 hover:text-green-800"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Message Banner */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-in fade-in duration-300">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-900 font-medium mb-1">{error}</p>
                                    {error.includes("Account not found") && (
                                        <Link
                                            to="/register"
                                            className="text-sm text-red-700 hover:text-red-800 font-medium underline inline-flex items-center gap-1"
                                        >
                                            Apply for an account →
                                        </Link>
                                    )}
                                </div>
                                <button
                                    onClick={() => setError("")}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm text-gray-700 mb-2 font-medium">
                                Username or Email
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError("");
                                }}
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                                    error ? "border-red-300" : "border-gray-200"
                                }`}
                                placeholder="Enter your username or email"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm text-gray-700 mb-2 font-medium">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300 ${
                                    error ? "border-red-300" : "border-gray-200"
                                }`}
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg font-medium cursor-pointer transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Signing in..." : "Login"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowGuestModal(true)}
                            className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg transition-all duration-300 font-medium cursor-pointer"
                        >
                            Continue as Guest
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
                        <p className="pt-2">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                                Apply here
                            </Link>
                        </p>
                        <p className="text-xs text-gray-500">
                            Student and Instructor accounts require approval <br /> Registrar accounts contact IT
                        </p>
                    </div>
                </div>
            </div>

            {/* Guest Type Selection Modal */}
            {showGuestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl text-gray-900">Select Guest Access Type</h2>
                            <button
                                onClick={() => setShowGuestModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Choose the type of guest access you need to explore the portal.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleGuestLogin("guest-student")}
                                className="w-full p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-300 text-left group cursor-pointer transform hover:scale-[1.02]"
                            >
                                <h3 className="text-gray-900 mb-1 font-medium group-hover:text-blue-600 transition-colors">Student Portal</h3>
                                <p className="text-sm text-gray-600">View courses, schedules, and registration</p>
                            </button>

                            <button
                                onClick={() => handleGuestLogin("guest-instructor")}
                                className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all duration-300 text-left group cursor-pointer transform hover:scale-[1.02]"
                            >
                                <h3 className="text-gray-900 mb-1 font-medium group-hover:text-green-600 transition-colors">Instructor Portal</h3>
                                <p className="text-sm text-gray-600">View courses, rosters, and grade submission</p>
                            </button>

                            <button
                                onClick={() => handleGuestLogin("guest-registrar")}
                                className="w-full p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-300 rounded-xl transition-all duration-300 text-left group cursor-pointer transform hover:scale-[1.02]"
                            >
                                <h3 className="text-gray-900 mb-1 font-medium group-hover:text-purple-600 transition-colors">Registrar Portal</h3>
                                <p className="text-sm text-gray-600">View course management and approvals</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
