from datetime import datetime

#FILE: Handles student course review submission and rating updates.


# Banned-word filter
 
# Add or remove words from this list as needed.
BANNED_WORDS = [
    "asshole", "fuck", "shit", "bitch", "damn", "retard"
]
 
# Any review containing 3 or more banned words is suppressed and triggers a double warning.
def apply_banned_word_filter(text: str) -> dict:

    lower_text  = text.lower()
    banned_count = 0
    clean_text   = text
    
    # Count occurrences of each banned word (non-case-sensitive) and replaces them with "[removed]".
    for word in BANNED_WORDS:
        if word in lower_text:
            count = lower_text.count(word)
            banned_count += count
            # Non-case-sensitive replacement
            import re
            clean_text = re.sub(re.escape(word), "[removed]", clean_text, flags=re.IGNORECASE)
 
    return {"text": clean_text, "banned_count": banned_count}
 
 
#  Review Submission


def submit_review(supabase, student_id: str, course_id: str, rating: int, comment_text: str) -> dict:
    # Check eligibility: student must have an enrollment record for this course
    enrollment_res = (
        supabase.table("enrollments")
        .select("id, grade")
        .eq("student_id", student_id)
        .eq("course_id", course_id)
        .execute()
    )
    if not enrollment_res.data:
        return {
            "success": False,
            "message": "Student not eligible to review this course.",
        }
 
    # Validate rating
    if not isinstance(rating, int) or not (1 <= rating <= 5):
        return {
            "success": False,
            "message": "Rating must be an integer between 1 and 5.",
        }
 
    # Apply banned-word filter
    filtered      = apply_banned_word_filter(comment_text)
    banned_count  = filtered["banned_count"]
    clean_text    = filtered["text"]
 
    # Suppress review and provide second warning if 3+ banned words 
    if banned_count >= 3:
        _issue_warning(supabase, student_id, reason="Review contained 3+ banned words")
        _issue_warning(supabase, student_id, reason="Review suppressed")
        return {
            "success": False,
            "message": "Review suppressed due to inappropriate content.",
        }
 
    # Single warning if 1 or 2 banned words (review still saved, cleaned)
    if banned_count >= 1:
        _issue_warning(supabase, student_id, reason="Review contained banned words")
 
    # Build and persist the review record
    review = {
        "student_id":  student_id,
        "course_id":   course_id,
        "rating":      rating,
        "text":        clean_text,
        "suppressed":  False,
        "created_at":  datetime.utcnow().isoformat(),
    }
    supabase.table("reviews").insert(review).execute()
 
    # Refresh the course's aggregate rating
    _update_course_rating(supabase, course_id)
 
    return {"success": True, "message": "Review submitted.", "review": review}
 
 
# Internal helpers
 
def _update_course_rating(supabase, course_id: str) -> None:
    # Recalculate and store the average rating for a course from all non-suppressed reviews.

    reviews_res = (
        supabase.table("reviews")
        .select("rating")
        .eq("course_id", course_id)
        .eq("suppressed", False)
        .execute()
    )
    ratings = [r["rating"] for r in (reviews_res.data or [])]
    avg = round(sum(ratings) / len(ratings), 2) if ratings else None
 
    supabase.table("courses").update(
        {"average_rating": avg}
    ).eq("id", course_id).execute()
 
 
def _issue_warning(supabase, target_id: str, reason: str) -> None:
    #Insert a warning record for a student.
    supabase.table("warnings").insert(
        {
            "target_id":  target_id,
            "reason":     reason,
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()