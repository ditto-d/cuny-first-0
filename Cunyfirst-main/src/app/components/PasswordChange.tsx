import { useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, CheckCircle, GraduationCap, Lock } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../utils/api";

function dashboardPathForRole(role: string | null) {
  if (role === "registrar") return "/registrar";
  if (role === "instructor") return "/instructor";
  return "/student";
}

export function PasswordChange() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setError("Your session expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("/auth/change-password"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not change password.");
      }

      localStorage.setItem("userMustChangePassword", "false");
      toast.success("Password changed successfully.");
      navigate(dashboardPathForRole(data.user?.role || userRole), { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not change password.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">Change Password</h1>
            <p className="text-gray-600">Set a new password before continuing.</p>
            {userEmail && <p className="text-sm text-gray-500 mt-2">{userEmail}</p>}
          </div>

          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                This account is using a temporary password. Choose a new password to access your dashboard.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="newPassword" className="block text-sm text-gray-700 mb-2 font-medium">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a new password"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-700 mb-2 font-medium">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your new password"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
