import { Link } from "react-router";
import { GraduationCap, Clock, CheckCircle, Mail, ArrowLeft } from "lucide-react";

export function PendingApproval() {
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
            <h1 className="text-4xl text-gray-900 mb-2">CUNYfirst</h1>
            <p className="text-gray-600">Course Registration System</p>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl text-gray-900 mb-2 font-semibold">Request Pending Approval</h2>
                <p className="text-gray-700 mb-4">
                  Your instructor access request has been submitted successfully and is currently under review by the registrar's office.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>You will receive an email notification once your request is reviewed</span>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="mb-6">
            <h3 className="text-lg text-gray-900 font-semibold mb-4">What happens next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-1">Verification</p>
                  <p className="text-sm text-gray-600">
                    The registrar's office will verify your employee ID, department affiliation, and university email address.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-1">Review Process</p>
                  <p className="text-sm text-gray-600">
                    Your request will be reviewed within 2-3 business days. Additional documentation may be requested if needed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-1">Notification</p>
                  <p className="text-sm text-gray-600">
                    You will receive an email with login credentials if approved, or additional information if more details are needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h3 className="text-gray-900 font-semibold mb-3">Need Help?</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Email:</span> registrar@cuny.edu
              </p>
              <p>
                <span className="font-medium">Phone:</span> (555) 123-4567
              </p>
              <p>
                <span className="font-medium">Office Hours:</span> Monday - Friday, 9:00 AM - 5:00 PM
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Return to Login
            </Link>

            <Link
              to="/guest-instructor"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-all font-medium"
            >
              Explore as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
