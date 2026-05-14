from ast import Return
from datetime import date, datetime, timezone
from services.utils import letter_to_points, VALID_GRADES

# File: Handles grade submission, retrieval, and GPA calculation.

# Grade Submission
 
def submit_grade(supabase, instructor_id: str, section_id: str, student_id: str, letter_grade: str) -> dict:
    # Check grading period
    period_res = (
        supabase.table("system_settings")
        .select("value")
        .eq("key", "current_period")
        .single()
        .execute()
    )
    if not period_res.data or period_res.data["value"] != "grading":
        return {"success": False, "message": "Grading period is not active."}
 
    # Verify section exists and belongs to this instructor
    section_res = (
        supabase.table("sections")
        .select("*")
        .eq("id", section_id)
        .single()
        .execute()
    )
    if not section_res.data:
        return {"success": False, "message": "Section not found."}
    if section_res.data["instructor_id"] != instructor_id:
        return {"success": False, "message": "You are not the instructor of this section."}
 
    # Verify student is enrolled
    enrollment_res = (
        supabase.table("enrollments")
        .select("id")
        .eq("section_id", section_id)
        .eq("student_id", student_id)
        .execute()
    )
    if not enrollment_res.data:
        return {"success": False, "message": "Student is not enrolled in this section."}
 
    # Validate letter grade
    if letter_grade not in VALID_GRADES:
        return {
            "success": False,
            "message": f"Invalid grade. Must be one of: {', '.join(VALID_GRADES)}",
        }
 
    # Update the enrollment record with the submitted grade and timestamp.
    supabase.table("enrollments").update(
        {"grade": letter_grade, "graded_at": datetime.utcnow().isoformat()}
    ).eq("section_id", section_id).eq("student_id", student_id).execute()
 
    # Trigger GPA recalculation and academic standing check
    recalculate_gpa(supabase, student_id)
    evaluate_academic_standing(supabase, student_id)
 
    return {"success": True, "message": "Grade submitted successfully."}
 
 
# Grade Retrieval
# Returns a list of all recorded grades for the student, including course and semester info.
def get_grades(supabase, student_id: str) -> list:
    enrollments_res = (
        supabase.table("enrollments")
        .select("section_id, course_id, grade, semester")
        .eq("student_id", student_id)
        .not_.is_("grade", "null")
        .execute()
    )
 
    grade_list = []
    for e in (enrollments_res.data or []):
        grade_list.append(
            {
                "section_id":   e["section_id"],
                "course_id":    e["course_id"],
                "letter_grade": e["grade"],
                "semester":     e["semester"],
            }
        )
 
    return grade_list
 
 
# GPA Calculation

 
def recalculate_gpa(supabase, student_id: str) -> dict:
    # Get the current semester identifier
    sem_res = (
        supabase.table("system_settings")
        .select("value")
        .eq("key", "current_semester")
        .single()
        .execute()
    )
    current_semester = sem_res.data["value"] if sem_res.data else None
 
    # Semester GPA
    if current_semester:
        sem_enrollments_res = (
            supabase.table("enrollments")
            .select("course_id, grade")
            .eq("student_id", student_id)
            .eq("semester", current_semester)
            .not_.is_("grade", "null")
            .execute()
        )
        sem_enrollments = sem_enrollments_res.data or []
    else:
        sem_enrollments = []
 
    semester_gpa = _weighted_gpa(supabase, sem_enrollments)
 
    # Cumulative GPA 
    all_enrollments_res = (
        supabase.table("enrollments")
        .select("course_id, grade")
        .eq("student_id", student_id)
        .not_.is_("grade", "null")
        .execute()
    )
    all_enrollments = all_enrollments_res.data or []
    cumulative_gpa = _weighted_gpa(supabase, all_enrollments)
 
    # Persist updated GPAs on the student record
    supabase.table("students").update(
        {
            "semester_gpa":   semester_gpa,
            "cumulative_gpa": cumulative_gpa,
        }
    ).eq("id", student_id).execute()
 
    return {"semester_gpa": semester_gpa, "cumulative_gpa": cumulative_gpa}
 
# Internal helper to compute weighted GPA from a list of enrollments. 
def _weighted_gpa(supabase, enrollments: list) -> float:
    if not enrollments:
        return 0.0
 
    total_points = 0.0
    total_credits = 0
 
    for e in enrollments:
        course_res = (
            supabase.table("courses")
            .select("credits")
            .eq("id", e["course_id"])
            .single()
            .execute()
        )
        if not course_res.data:
            continue
        credits = course_res.data["credits"]
        total_points  += letter_to_points(e["grade"]) * credits
        total_credits += credits
 
    return round(total_points / total_credits, 2) if total_credits else 0.0
 
# GPA Retrieval
# Returns the stored semester and cumulative GPA for the student.
def get_gpa(supabase, student_id: str) -> dict:
    # Fetch the student's GPA info
    student_res = (
        supabase.table("students")
        .select("semester_gpa, cumulative_gpa")
        .eq("id", student_id)
        .single()
        .execute()
    )
    if not student_res.data:
        return {"success": False, "message": "Student not found."}
 
    return {
        "success":        True,
        "semester_gpa":   student_res.data["semester_gpa"],
        "cumulative_gpa": student_res.data["cumulative_gpa"],
    }
 
 
# Academic Standing
# Evaluates a student's academic standing based on their GPA and enrollment history, 
# and takes action if necessary (e.g. issuing warnings, flagging for registrar interview, 
# or terminating enrollment).
def evaluate_academic_standing(supabase, student_id: str) -> dict:
    # Fetch the student's GPA info
    student_res = (
        supabase.table("students")
        .select("semester_gpa, cumulative_gpa")
        .eq("id", student_id)
        .single()
        .execute()
    )
    if not student_res.data:
        return {"action": "no_change", "message": "Student not found."}
 
    cumulative_gpa = student_res.data["cumulative_gpa"]
 
    # Rule 1: cumulative GPA too low = termination
    if cumulative_gpa < 2.0:
        _terminate_student(supabase, student_id, reason="Cumulative GPA below 2.0")
        return {"action": "terminated"}
 
    # Rule 2: failed the same course twice = termination
    if _has_failed_same_course_twice(supabase, student_id):
        _terminate_student(supabase, student_id, reason="Failed same course twice")
        return {"action": "terminated"}
 
    # Rule 3: borderline GPA = warning
    if 2.0 <= cumulative_gpa <= 2.25:
        _issue_warning(
            supabase, student_id,
            reason="Cumulative GPA between 2.0 and 2.25"
        )
        _flag_for_registrar_interview(supabase, student_id)
        return {"action": "warning_issued"}
 
    return {"action": "no_change"}
 
 
def _has_failed_same_course_twice(supabase, student_id: str) -> bool:
    # Return True if the student has an 'F' in the same course_id at least twice.
    failed_res = (
        supabase.table("enrollments")
        .select("course_id")
        .eq("student_id", student_id)
        .eq("grade", "F")
        .execute()
    )
    course_ids = [e["course_id"] for e in (failed_res.data or [])]
    return len(course_ids) != len(set(course_ids))
 
 
def _terminate_student(supabase, student_id: str, reason: str) -> None:
    # Mark student record as terminated and log the reason.
    supabase.table("students").update(
        {
            "status":             "terminated",
            "termination_reason": reason,
            "terminated_at":      datetime.utcnow().isoformat(),
        }
    ).eq("id", student_id).execute()
 
    supabase.table("academic_actions").insert(
        {
            "student_id": student_id,
            "action":     "terminated",
            "reason":     reason,
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()
 
 
def _issue_warning(supabase, student_id: str, reason: str) -> None:
    # Insert a warning record for the student.
    supabase.table("warnings").insert(
        {
            "target_id":  student_id,
            "reason":     reason,
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()
 
 
def _flag_for_registrar_interview(supabase, student_id: str) -> None:
    # Flag the student so the registrar knows to schedule an interview.
    supabase.table("registrar_flags").insert(
        {
            "student_id": student_id,
            "flag_type":  "interview_required",
            "created_at": datetime.utcnow().isoformat(),
        }
    ).execute()