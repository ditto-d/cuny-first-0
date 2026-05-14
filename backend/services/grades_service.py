from datetime import datetime, date, timezone
from services.utils import letter_to_points, VALID_GRADES, GPA_GRADES

# File: Handles grade submission, retrieval, GPA calculation, academic standing evaluation, and ungraded student checks.
# Grade Submission

# Simple banned-word filter for review comments. Returns cleaned text and count of banned words.
def submit_grade(supabase, instructor_id: int, section_id: int, student_id: int, letter_grade: str) -> dict:
    # Verify section exists and belongs to this instructor
    section_res = (
        supabase.table("section")
        .select("instructor_id")
        .eq("section_id", section_id)
        .single()
        .execute()
    )
    if not section_res.data:
        return {"success": False, "message": "Section not found."}
    if section_res.data["instructor_id"] != instructor_id:
        return {"success": False, "message": "You are not the instructor of this section."}

    # Verify student is enrolled and get enrollment_id
    enrollment_res = (
        supabase.table("enrollment")
        .select("enrollment_id")
        .eq("section_id", section_id)
        .eq("student_id", student_id)
        .single()
        .execute()
    )
    if not enrollment_res.data:
        return {"success": False, "message": "Student is not enrolled in this section."}

    enroll_id = enrollment_res.data["enrollment_id"]

    # Validate letter grade
    if letter_grade not in VALID_GRADES:
        return {"success": False, "message": f"Invalid grade. Allowed: {', '.join(VALID_GRADES)}"}

    # Upsert into grade table (enrollment_id is UNIQUE so upsert is safe)
    supabase.table("grade").upsert({
        "enrollment_id": enroll_id,
        "instructor_id": instructor_id,
        "letter_grade":  letter_grade,
        "date_assigned": date.today().isoformat()
    }).execute()

    # Trigger GPA recalculation and standing evaluation
    recalculate_gpa(supabase, student_id)
    evaluate_academic_standing(supabase, student_id, instructor_id)

    return {"success": True, "message": "Grade submitted successfully."}


# Grade Retrieval

def get_grades(supabase, student_id: int) -> list:
    res = (
        supabase.table("enrollment")
        .select(
            "section_id, "
            "section(course_id, semester, year, course(course_code, course_name)), "
            "grade(letter_grade, date_assigned)"
        )
        .eq("student_id", student_id)
        .execute()
    )

    grade_list = []

    for item in (res.data or []):
        grade_data = item.get("grade")

        if isinstance(grade_data, list):
            grade_data = grade_data[0] if grade_data else None

        if not grade_data:
            continue

        section = item.get("section") or {}
        course = section.get("course") or {}

        grade_list.append({
            "section_id": item.get("section_id"),
            "course_id": section.get("course_id"),
            "course_code": course.get("course_code", "N/A"),
            "course_name": course.get("course_name", "Unknown Course"),
            "semester": f"{section.get('semester', '')} {section.get('year', '')}".strip(),
            "letter_grade": grade_data.get("letter_grade"),
            "date_assigned": grade_data.get("date_assigned"),
        })

    return grade_list


# GPA Calculation

def recalculate_gpa(supabase, student_id: int) -> dict:
    res = (
        supabase.table("enrollment")
        .select("section(course_id, course(credits), semester, year), grade(letter_grade)")
        .eq("student_id", student_id)
        .execute()
    )

    enrollments = [e for e in (res.data or []) if e.get("grade")]

    today        = date.today()
    current_sem  = _semester_from_month(today.month)
    current_year = today.year

    total_points  = 0.0
    total_credits = 0
    sem_points    = 0.0
    sem_credits   = 0

    for e in enrollments:
        try:
            letter  = e["grade"]["letter_grade"]
            if letter not in GPA_GRADES:
                continue   # skip W / I

            credits = e["section"]["course"]["credits"]
            points  = letter_to_points(letter) * credits

            total_points  += points
            total_credits += credits

            # Track current semester separately for honor roll
            if (e["section"]["semester"] == current_sem and
                    e["section"]["year"] == current_year):
                sem_points  += points
                sem_credits += credits

        except (KeyError, TypeError):
            continue

    final_gpa    = round(total_points / total_credits, 2) if total_credits else 0.0
    semester_gpa = round(sem_points   / sem_credits,   2) if sem_credits   else 0.0

    # Persist on student row
    supabase.table("student").update(
        {"gpa": final_gpa}
    ).eq("student_id", student_id).execute()

    # Performance snapshot
    supabase.table("performance").insert({
        "student_id":   student_id,
        "semester":     current_sem,
        "year":         current_year,
        "gpa_snapshot": final_gpa,
        "comments":     "Automatic GPA recalculation",
    }).execute()

    return {"gpa": final_gpa, "semester_gpa": semester_gpa}

# Get current GPA for a student (read-only, no recalculation).
def get_gpa(supabase, student_id: int) -> dict:
    res = (
        supabase.table("student")
        .select("gpa")
        .eq("student_id", student_id)
        .single()
        .execute()
    )
    if not res.data:
        return {"success": False, "message": "Student not found."}
    return {"success": True, "gpa": res.data["gpa"]}


# Academic Standing

# Evaluates and updates a student's academic standing based on their GPA and disciplinary record.
def evaluate_academic_standing(supabase, student_id: int, creator_id: int = None) -> dict:
    student_res = (
        supabase.table("student")
        .select("gpa")
        .eq("student_id", student_id)
        .single()
        .execute()
    )
    if not student_res.data:
        return {"action": "none"}

    gpa        = float(student_res.data["gpa"])
    issuer_id  = creator_id or _get_system_registrar_id(supabase)

    # Rule 1: GPA < 2.0 = expulsion
    if gpa < 2.0:
        supabase.table("student").update({
            "is_active":        False,
            "academic_standing": "Expelled",
        }).eq("student_id", student_id).execute()
        _log_disciplinary(supabase, student_id, issuer_id,
                          "Expulsion", "GPA dropped below 2.0")
        return {"action": "expelled"}

    # Rule 2: Failed same course twice = expulsion
    if _has_failed_same_course_twice(supabase, student_id):
        supabase.table("student").update({
            "is_active":        False,
            "academic_standing": "Expelled",
        }).eq("student_id", student_id).execute()
        _log_disciplinary(supabase, student_id, issuer_id,
                          "Expulsion", "Failed the same course twice")
        return {"action": "expelled"}

    # Rule 3: 3+ warnings = suspension
    warning_count = _count_warnings(supabase, student_id)
    if warning_count >= 3:
        supabase.table("student").update({
            "is_active":        False,
            "academic_standing": "Suspended",
        }).eq("student_id", student_id).execute()
        _log_disciplinary(supabase, student_id, issuer_id,
                          "Suspension",
                          "Accumulated 3 or more warnings. "
                          "Suspended 1 semester. Fine must be paid to registrar.")
        return {"action": "suspended"}

    # Rule 4: borderline GPA = warning + registrar interview
    if 2.0 <= gpa <= 2.25:
        supabase.table("student").update({
            "academic_standing": "Warning"
        }).eq("student_id", student_id).execute()
        _log_disciplinary(supabase, student_id, issuer_id,
                          "Warning",
                          "GPA between 2.0 and 2.25 — registrar interview required.")
        return {"action": "warning_issued"}

    # Rule 5: honor roll check
    gpa_data       = recalculate_gpa(supabase, student_id)
    semester_gpa   = gpa_data.get("semester_gpa", 0.0)
    semesters_done = _count_completed_semesters(supabase, student_id)

    honor = semester_gpa > 3.75 or (semesters_done > 1 and gpa > 3.5)
    if honor:
        supabase.table("student").update({
            "academic_standing": "Honor Roll"
        }).eq("student_id", student_id).execute()

        if warning_count > 0:
            _remove_one_warning(supabase, student_id)
            return {"action": "honor_roll", "warning_removed": True}

        return {"action": "honor_roll", "warning_removed": False}

    # All clear
    supabase.table("student").update({
        "academic_standing": "Good Standing"
    }).eq("student_id", student_id).execute()
    return {"action": "no_change"}

# Check for students without grades in a section and warn the instructor.
def check_ungraded_students(supabase, section_id: int) -> dict:
    section_res = (
        supabase.table("section")
        .select("instructor_id")
        .eq("section_id", section_id)
        .single()
        .execute()
    )
    if not section_res.data:
        return {"warned": False, "ungraded_count": 0}

    instructor_id = section_res.data["instructor_id"]

    enrollments_res = (
        supabase.table("enrollment")
        .select("enrollment_id, grade(grade_id)")
        .eq("section_id", section_id)
        .execute()
    )

    ungraded = sum(
        1 for e in (enrollments_res.data or []) if not e.get("grade")
    )

    if ungraded > 0 and instructor_id:
        registrar_id = _get_system_registrar_id(supabase)
        _log_disciplinary(
            supabase,
            student_id=instructor_id,
            creator_id=registrar_id,
            action_type="Warning",
            reason=f"Did not submit grades for {ungraded} student(s) "
                   f"in section {section_id}",
        )
        return {"warned": True, "ungraded_count": ungraded}

    return {"warned": False, "ungraded_count": 0}


# Class GPA Check

# Calculates average GPA of all students in a section.
# Flags instructor for registrar questioning if class GPA is above 3.5 or below 2.5.
def check_class_gpa(supabase, section_id: int) -> dict:
    section_res = (
        supabase.table("section")
        .select("instructor_id")
        .eq("section_id", section_id)
        .single()
        .execute()
    )
    if not section_res.data:
        return {"flagged": False, "message": "Section not found."}

    instructor_id = section_res.data["instructor_id"]

    enrollments_res = (
        supabase.table("enrollment")
        .select("grade(letter_grade), section(course_id, course(credits))")
        .eq("section_id", section_id)
        .execute()
    )

    graded = [e for e in (enrollments_res.data or []) if e.get("grade")]
    if not graded:
        return {"flagged": False, "message": "No graded students in this section."}

    total_points  = 0.0
    total_credits = 0
    for e in graded:
        try:
            letter = e["grade"]["letter_grade"]
            if letter not in GPA_GRADES:
                continue
            credits = e["section"]["course"]["credits"]
            total_points  += letter_to_points(letter) * credits
            total_credits += credits
        except (KeyError, TypeError):
            continue

    if total_credits == 0:
        return {"flagged": False, "message": "No GPA-counting grades found."}

    class_gpa = round(total_points / total_credits, 2)

    # Warn instructor if class GPA is outside acceptable range
    if class_gpa > 3.5 or class_gpa < 2.5:
        registrar_id = _get_system_registrar_id(supabase)
        _log_disciplinary(
            supabase,
            student_id=instructor_id,
            creator_id=registrar_id,
            action_type="Warning",
            reason=f"Class GPA of {class_gpa} is outside acceptable range (2.5 - 3.5). "
                   f"Registrar questioning required.",
        )
        return {"flagged": True, "class_gpa": class_gpa, "instructor_id": instructor_id}

    return {"flagged": False, "class_gpa": class_gpa}


# Graduation

# Student applies for graduation after completing 8 courses.
# Creates a pending graduation_application record for the registrar to review.
def apply_for_graduation(supabase, student_id: int) -> dict:
    res = (
        supabase.table("enrollment")
        .select("grade(letter_grade)")
        .eq("student_id", student_id)
        .execute()
    )

    completed = [
        e for e in (res.data or [])
        if e.get("grade") and e["grade"]["letter_grade"] in GPA_GRADES
    ]

    if len(completed) < 8:
        return {
            "success": False,
            "message": f"You have only completed {len(completed)} course(s). "
                       f"8 are required to apply for graduation.",
        }

    # Check for an existing application
    existing_res = (
        supabase.table("graduation_application")
        .select("application_id, status")
        .eq("student_id", student_id)
        .execute()
    )
    for app in (existing_res.data or []):
        if app["status"] == "Pending":
            return {"success": False, "message": "You already have a pending graduation application."}
        if app["status"] == "Approved":
            return {"success": False, "message": "You have already graduated."}

    supabase.table("graduation_application").insert({
        "student_id": student_id,
        "status":     "Pending",
    }).execute()

    return {"success": True, "message": "Graduation application submitted. Awaiting registrar review."}


# Registrar reviews a graduation application.
# Approved: student graduates and is marked inactive.
# Rejected: student receives a warning for a reckless application.
def review_graduation(supabase, application_id: int, registrar_id: int,
                      approved: bool, justification: str = "") -> dict:
    app_res = (
        supabase.table("graduation_application")
        .select("*")
        .eq("application_id", application_id)
        .single()
        .execute()
    )
    if not app_res.data:
        return {"success": False, "message": "Application not found."}

    app = app_res.data
    if app["status"] != "Pending":
        return {"success": False, "message": "This application has already been reviewed."}

    student_id = app["student_id"]

    if approved:
        supabase.table("student").update({
            "is_active":        False,
            "academic_standing": "Graduated",
        }).eq("student_id", student_id).execute()

        supabase.table("graduation_application").update({
            "status":      "Approved",
            "reviewed_by": registrar_id,
            "reviewed_at": date.today().isoformat(),
        }).eq("application_id", application_id).execute()

        return {"success": True, "action": "graduated",
                "message": "Student has graduated with a Bachelor's degree."}
    else:
        # Warn student for reckless graduation application
        _log_disciplinary(
            supabase,
            student_id=student_id,
            creator_id=registrar_id,
            action_type="Warning",
            reason="Reckless graduation application — required courses not covered.",
            description=justification,
        )

        supabase.table("graduation_application").update({
            "status":      "Rejected",
            "reviewed_by": registrar_id,
            "reviewed_at": date.today().isoformat(),
        }).eq("application_id", application_id).execute()

        return {"success": True, "action": "rejected",
                "message": "Application rejected. Student has been warned."}


# Private helpers

# Return True if the student has an F in the same course at least twice.
def _has_failed_same_course_twice(supabase, student_id: int) -> bool:
    res = (
        supabase.table("enrollment")
        .select("section(course_id), grade(letter_grade)")
        .eq("student_id", student_id)
        .execute()
    )
    failed = [
        e["section"]["course_id"]
        for e in (res.data or [])
        if e.get("grade") and e["grade"]["letter_grade"] == "F"
    ]
    return len(failed) != len(set(failed))

# Count the number of active warnings for a student.
def _count_warnings(supabase, student_id: int) -> int:
    res = (
        supabase.table("disciplinary")
        .select("action_id")
        .eq("student_id", student_id)
        .eq("action_type", "Warning")
        .execute()
    )
    return len(res.data or [])

# Delete the oldest Warning record for this student (honor roll perk).
def _remove_one_warning(supabase, student_id: int) -> None:
    res = (
        supabase.table("disciplinary")
        .select("action_id")
        .eq("student_id", student_id)
        .eq("action_type", "Warning")
        .order("issue_date", desc=False)
        .limit(1)
        .execute()
    )
    if res.data:
        supabase.table("disciplinary").delete().eq(
            "action_id", res.data[0]["action_id"]
        ).execute()

# Count completed semesters (for honor roll eligibility)
def _count_completed_semesters(supabase, student_id: int) -> int:
    res = (
        supabase.table("enrollment")
        .select("section(semester, year), grade(grade_id)")
        .eq("student_id", student_id)
        .execute()
    )
    semesters = set()
    for e in (res.data or []):
        if e.get("grade"):
            sec = e.get("section") or {}
            key = (sec.get("semester"), sec.get("year"))
            if key[0] and key[1]:
                semesters.add(key)
    return len(semesters)

# Updates the student's academic standing based on their GPA and disciplinary record.
def _log_disciplinary(supabase, student_id: int, creator_id: int, action_type: str, reason: str, description: str = "") -> None:
    supabase.table("disciplinary").insert({
        "student_id":  student_id,
        "created_by":  creator_id,
        "issued_by":   creator_id,
        "action_type": action_type,
        "reason":      reason,
        "description": description or f"Automated action: {reason}",
    }).execute()

# Helper to get a registrar ID for system-generated actions when no creator_id is provided.
def _get_system_registrar_id(supabase) -> int:
    res = supabase.table("registrar").select("registrar_id").limit(1).execute()
    if res.data:
        return res.data[0]["registrar_id"]
    raise RuntimeError("No registrar found in the database.")

# Simple helper to convert month number to semester name for GPA snapshots.
def _semester_from_month(month: int) -> str:
    if month in (1, 2, 3, 4, 5):
        return "Spring"
    if month in (6, 7, 8):
        return "Summer"
    return "Fall"