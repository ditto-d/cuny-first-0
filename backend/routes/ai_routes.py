from flask import Blueprint, request, jsonify
from services.supabase_client import supabase

ai_bp = Blueprint("ai_bp", __name__)


@ai_bp.route("/ai/ask", methods=["POST"])
def ask_ai():
    data = request.get_json() or {}

    role = data.get("role", "visitor")
    question = data.get("question", "")
    user_id = data.get("user_id")
    question_lower = question.lower()

    if not question:
        return jsonify({
            "success": False,
            "message": "Question is required."
        }), 400

    # =========================
    # STUDENT
    # =========================
    if role == "student":

        # Students cannot see rosters
        if "people" in question_lower or "roster" in question_lower:
            return jsonify({
                "success": True,
                "role": role,
                "question": question,
                "result": {
                    "answer": "Students are not authorized to view class rosters.",
                    "source": "authorization_rule",
                    "warning": None
                }
            })

        # Student courses/schedule
        if (
            "course" in question_lower
            or "schedule" in question_lower
            or "class" in question_lower
        ):
            enrollments = (
                supabase.table("enrollment")
                .select(
                    "status, section(section_id, schedule, room, course(course_code, course_name, credits))"
                )
                .eq("student_id", user_id)
                .execute()
                .data or []
            )

            if enrollments:
                answer = "Here are your current courses:\n" + "\n".join(
                    f"- {e['section']['course']['course_code']}: "
                    f"{e['section']['course']['course_name']} "
                    f"({e['status']}, {e['section']['schedule']}, {e['section']['room']})"
                    for e in enrollments
                    if e.get("section") and e["section"].get("course")
                )

                return jsonify({
                    "success": True,
                    "role": role,
                    "question": question,
                    "result": {
                        "answer": answer,
                        "source": "live_database",
                        "warning": None
                    }
                })

            return jsonify({
                "success": True,
                "role": role,
                "question": question,
                "result": {
                    "answer": "I could not find any courses for your student ID.",
                    "source": "live_database",
                    "warning": None
                }
            })

        # Student grades/GPA
        if "grade" in question_lower or "gpa" in question_lower:

            grades = (
                supabase.table("enrollment")
                .select(
                    "section(course(course_code, course_name)), grade(letter_grade)"
                )
                .eq("student_id", user_id)
                .execute()
                .data or []
            )

            graded = [g for g in grades if g.get("grade")]

            if graded:
                answer = "Here are your posted grades:\n" + "\n".join(
                    f"- {g['section']['course']['course_code']}: "
                    f"{g['grade']['letter_grade']}"
                    for g in graded
                    if g.get("section") and g["section"].get("course")
                )

                return jsonify({
                    "success": True,
                    "role": role,
                    "question": question,
                    "result": {
                        "answer": answer,
                        "source": "live_database",
                        "warning": None
                    }
                })

    # =========================
    # INSTRUCTOR
    # =========================
    if role == "instructor":

        # Instructor sections/courses
        if (
            "course" in question_lower
            or "class" in question_lower
            or "section" in question_lower
        ):

            sections = (
                supabase.table("section")
                .select(
                    "section_id, schedule, room, seats, status, "
                    "course(course_code, course_name, credits)"
                )
                .eq("instructor_id", user_id)
                .execute()
                .data or []
            )

            if sections:
                answer = "You are currently assigned to:\n" + "\n".join(
                    f"- {s['course']['course_code']}: "
                    f"{s['course']['course_name']} "
                    f"(Section {s['section_id']}, "
                    f"{s['schedule']}, {s['room']}, "
                    f"status: {s['status']})"
                    for s in sections
                    if s.get("course")
                )

                return jsonify({
                    "success": True,
                    "role": role,
                    "question": question,
                    "result": {
                        "answer": answer,
                        "source": "live_database",
                        "warning": None
                    }
                })

        # Instructor roster/student lookup
        if "student" in question_lower or "roster" in question_lower:

            sections = (
                supabase.table("section")
                .select(
                    "section_id, "
                    "course(course_code, course_name), "
                    "enrollment(student_id, status)"
                )
                .eq("instructor_id", user_id)
                .execute()
                .data or []
            )

            if sections:
                lines = []

                for section in sections:
                    course = section.get("course") or {}
                    enrollments = section.get("enrollment") or []

                    lines.append(
                        f"- {course.get('course_code', 'Unknown')}: "
                        f"{len(enrollments)} student(s)"
                    )

                answer = "Here is your roster summary:\n" + "\n".join(lines)

                return jsonify({
                    "success": True,
                    "role": role,
                    "question": question,
                    "result": {
                        "answer": answer,
                        "source": "live_database",
                        "warning": None
                    }
                })

    # =========================
    # REGISTRAR
    # =========================
    if role == "registrar":

        # Graduation applications
        if "graduation" in question_lower or "graduate" in question_lower:

            apps = (
                supabase.table("graduation_application")
                .select("*")
                .execute()
                .data or []
            )

            pending = [
                a for a in apps
                if a.get("status") == "Pending"
            ]

            return jsonify({
                "success": True,
                "role": role,
                "question": question,
                "result": {
                    "answer": (
                        f"There are {len(pending)} pending "
                        f"graduation application(s)."
                    ),
                    "source": "live_database",
                    "warning": None
                }
            })

        # Complaints
        if "complaint" in question_lower:

            complaints = (
                supabase.table("complaint")
                .select("*")
                .execute()
                .data or []
            )

            pending = [
                c for c in complaints
                if c.get("status") == "Pending"
            ]

            return jsonify({
                "success": True,
                "role": role,
                "question": question,
                "result": {
                    "answer": (
                        f"There are {len(pending)} "
                        f"pending complaint(s)."
                    ),
                    "source": "live_database",
                    "warning": None
                }
            })

    # =========================
    # FALLBACK
    # =========================
    try:
        from services.ai_services import AIService

        result = AIService.answer_question(
            role,
            question,
            user_id
        )

    except ImportError as error:
        return jsonify({
            "success": False,
            "message": "AI service dependencies are not installed.",
            "error": str(error)
        }), 503

    except Exception as error:
        print("AI ROUTE ERROR:", error)

        return jsonify({
            "success": False,
            "message": "AI route failed.",
            "error": str(error)
        }), 500

    return jsonify({
        "success": True,
        "role": role,
        "question": question,
        "result": result
    })