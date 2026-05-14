import re
from datetime import date, datetime, timezone
 
# FILE: Handles student course review submission and rating updates.
  
# Banned-word filter
 
# Fetches the banned word list from the database (managed by registrars).
def _get_banned_words(supabase) -> list[str]:
    res = supabase.table("banned_word").select("word").execute()
    return [r["word"] for r in (res.data or [])]
 
 
# Scans comment text for banned words, counts occurrences, and replaces them with *.
# Returns the cleaned text and the count of banned words found.
def apply_banned_word_filter(text: str, banned_words: list[str]) -> dict:
    banned_count = 0
    clean_text   = text
 
    for word in banned_words:
        matches = re.findall(re.escape(word), clean_text, flags=re.IGNORECASE)
        if matches:
            banned_count += len(matches)
            clean_text = re.sub(
                re.escape(word),
                "*" * len(word),
                clean_text,
                flags=re.IGNORECASE,
            )
 
    return {"text": clean_text, "banned_count": banned_count}
 
 
# Review Submission
 
def submit_review(supabase, student_id: int, course_id: int, rating: int, comment_text: str) -> dict:
 
    # Check eligibility via enrollment -> section join
    enrollment_res = (
        supabase.table("enrollment")
        .select("enrollment_id, grade(grade_id), section!inner(course_id)")
        .eq("student_id", student_id)
        .eq("section.course_id", course_id)
        .execute()
    )
    if not enrollment_res.data:
        return {"success": False, "message": "Student not eligible to review this course."}
 
    # Block review if instructor has already posted a grade
    enrollment    = enrollment_res.data[0]
    enrollment_id = enrollment["enrollment_id"]
    if enrollment.get("grade"):
        return {"success": False, "message": "Reviews cannot be submitted after a grade has been posted."}
 
    # Validate rating
    if not isinstance(rating, int) or not (1 <= rating <= 5):
        return {"success": False, "message": "Rating must be an integer between 1 and 5."}
 
    # Load banned words from DB and apply filter
    banned_words = _get_banned_words(supabase)
    filtered     = apply_banned_word_filter(comment_text, banned_words)
    banned_count = filtered["banned_count"]
    clean_text   = filtered["text"]
 
    system_registrar_id = _get_system_registrar_id(supabase)
 
    # Suppress review and issue 2 warnings if 3+ banned words
    if banned_count >= 3:
        _issue_warning(supabase, student_id, system_registrar_id, reason="Review contained 3+ banned words")
        _issue_warning(supabase, student_id, system_registrar_id, reason="Review suppressed due to inappropriate content")
        return {"success": False, "message": "Review suppressed due to inappropriate content."}
 
    # Single warning if 1 or 2 banned words (review still saved, cleaned)
    if banned_count >= 1:
        _issue_warning(supabase, student_id, system_registrar_id, reason="Review contained banned words")
 
    # Build and persist the review record
    review = {
        "student_id": student_id,
        "course_id":  course_id,
        "rating":     rating,
        "text":       clean_text,
        "suppressed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("review").insert(review).execute()
 
    # Refresh the course's aggregate rating
    _update_course_rating(supabase, course_id, system_registrar_id)
 
    return {"success": True, "message": "Review submitted.", "review": review}
 
 
# Internal helpers
 
# Recalculates and stores the average rating for a course from all non-suppressed reviews.
# Warns the instructor if the average drops below 2.0.
def _update_course_rating(supabase, course_id: int, system_registrar_id: int) -> None:
    reviews_res = (
        supabase.table("review")
        .select("rating")
        .eq("course_id", course_id)
        .eq("suppressed", False)
        .execute()
    )
    ratings = [r["rating"] for r in (reviews_res.data or [])]
    avg = round(sum(ratings) / len(ratings), 2) if ratings else None
 
    supabase.table("course").update({"average_rating": avg}).eq("course_id", course_id).execute()
 
    # Warn instructor if average drops below 2.0
    if avg is not None and avg < 2.0:
        _warn_instructors_for_low_rating(supabase, course_id, avg, system_registrar_id)
 
 
# Issues a warning to every instructor teaching a section of this course.
# Suspends the instructor if they have accumulated 3 or more warnings.
def _warn_instructors_for_low_rating(supabase, course_id: int, avg: float, system_registrar_id: int) -> None:
    sections_res = (
        supabase.table("section")
        .select("instructor_id")
        .eq("course_id", course_id)
        .execute()
    )
 
    warned = set()
    for sec in (sections_res.data or []):
        instructor_id = sec.get("instructor_id")
        if not instructor_id or instructor_id in warned:
            continue
 
        supabase.table("disciplinary").insert({
            "student_id":  instructor_id,
            "created_by":  system_registrar_id,
            "issued_by":   system_registrar_id,
            "action_type": "Warning",
            "reason":      f"Course average rating is {avg} (below 2.0)",
            "issue_date":  date.today().isoformat(),
        }).execute()
 
        warned.add(instructor_id)
 
        # Check if instructor now has 3+ warnings and suspend if so
        _check_instructor_suspension(supabase, instructor_id, system_registrar_id)
 
 
# Suspends an instructor who has accumulated 3 or more warnings.
def _check_instructor_suspension(supabase, instructor_id: int, system_registrar_id: int) -> None:
    res = (
        supabase.table("disciplinary")
        .select("action_id")
        .eq("student_id", instructor_id)
        .eq("action_type", "Warning")
        .execute()
    )
    if len(res.data or []) >= 3:
        supabase.table("disciplinary").insert({
            "student_id":  instructor_id,
            "created_by":  system_registrar_id,
            "issued_by":   system_registrar_id,
            "action_type": "Suspension",
            "reason":      "Accumulated 3 warnings — cannot teach next semester.",
            "issue_date":  date.today().isoformat(),
        }).execute()
 
 
# Inserts a Warning row into the disciplinary table for a student.
def _issue_warning(supabase, student_id: int, issued_by: int, reason: str) -> None:
    supabase.table("disciplinary").insert({
        "student_id":  student_id,
        "created_by":  issued_by,
        "issued_by":   issued_by,
        "action_type": "Warning",
        "reason":      reason,
        "issue_date":  date.today().isoformat(),
    }).execute()
 
 
# Returns the first registrar's ID for system-generated actions.
def _get_system_registrar_id(supabase) -> int:
    res = supabase.table("registrar").select("registrar_id").limit(1).execute()
    if res.data:
        return res.data[0]["registrar_id"]
    raise RuntimeError("No registrar found in the database.")