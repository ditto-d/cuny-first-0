import { useState } from "react";
import { Star, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiUrl, readApiError } from "../utils/api";

export function StudentReviews() {
  const studentId = Number(localStorage.getItem("studentId") || 1);
  const [courseId, setCourseId] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!courseId.trim()) {
      toast.error("Please enter a course ID.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl("/reviews/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          course_id: Number(courseId),
          rating,
          comment_text: comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Could not submit review.");
        return;
      }

      toast.success("Review submitted successfully.");
      setCourseId("");
      setRating(0);
      setComment("");
    } catch {
      toast.error("Could not connect to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Submit a Course Review</h1>
          <p className="text-gray-600">Rate and review a course you are currently enrolled in</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Review Policy</p>
            <p className="text-blue-700">
              Reviews can only be submitted while you are enrolled and before a grade has been posted.
              Reviews containing inappropriate language will be filtered or suppressed.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Course ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="Enter the course ID"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">You can find the course ID in your schedule or grade history.</p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-3 font-medium">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Share your experience with this course..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length} characters</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
