import { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../utils/api";

export function StudentComplaints() {
  const studentId = Number(localStorage.getItem("studentId") || 1);
  const [targetId, setTargetId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!targetId.trim()) {
      toast.error("Please enter the ID of the person you are filing against.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe your complaint.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("/complaints/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complainant_id: studentId,
          complainant_role: "student",
          target_id: Number(targetId),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Could not submit complaint.");
        return;
      }

      setComplaintId(data.complaint_id);
      setSubmitted(true);
      toast.success("Complaint filed successfully.");
    } catch {
      toast.error("Could not connect to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTargetId("");
    setDescription("");
    setSubmitted(false);
    setComplaintId(null);
  };

  if (submitted) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl text-gray-900 mb-2">Complaint Filed</h2>
            <p className="text-gray-600 mb-2">Your complaint has been submitted and the registrar has been notified.</p>
            {complaintId && (
              <p className="text-sm text-gray-500 mb-6">Complaint ID: #{complaintId}</p>
            )}
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              File Another Complaint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">File a Complaint</h1>
          <p className="text-gray-600">Submit a formal complaint to the registrar</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <p className="font-medium mb-1">Important Notice</p>
            <p className="text-yellow-700">
              Filing a false complaint may result in a warning on your academic record.
              Please ensure your complaint is accurate and in good faith.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Target Account ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter the account ID of the instructor or student"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the system account ID of the person you are filing against.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe your complaint in detail. Include dates, specific incidents, and any relevant information..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length} characters</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>
      </div>
    </div>
  );
}
