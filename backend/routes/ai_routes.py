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

    # STUDENT: my courses / schedule / grades
    if role == "student":
        if "course" in question_lower or "schedule" in question_lower or "class" in question_lower:
            enrollments = (
                supabase.table("enrollment")
                .select("status, section(section_id, schedule, room, course(course_code, course_name, credits))")
                .eq("student_id", user_id)
                .execute()
                .data or []
            )

            if enrollments:
                answer = "Here are your current courses:\n" + "\n".join(
                    f"- {e['section']['course']['course_code']}: {e['section']['course']['course_name']} "
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

        if "grade" in question_lower or "gpa" in question_lower:
            grades = (
                supabase.table("enrollment")
                .select("section(course(course_code, course_name)), grade(letter_grade)")
                .eq("student_id", user_id)
                .execute()
                .data or []
            )

            graded = [g for g in grades if g.get("grade")]

            if graded:
                answer = "Here are your posted grades:\n" + "\n".join(
                    f"- {g['section']['course']['course_code']}: {g['grade']['letter_grade']}"
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

    # INSTRUCTOR: my courses / rosters
    if role == "instructor":
        if "course" in question_lower or "class" in question_lower or "section" in question_lower:
            sections = (
                supabase.table("section")
                .select("section_id, schedule, room, seats, status, course(course_code, course_name, credits)")
                .eq("instructor_id", user_id)
                .execute()
                .data or []
            )

            if sections:
                answer = "You are currently assigned to:\n" + "\n".join(
                    f"- {s['course']['course_code']}: {s['course']['course_name']} "
                    f"(Section {s['section_id']}, {s['schedule']}, {s['room']}, status: {s['status']})"
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

        if "student" in question_lower or "roster" in question_lower:
            sections = (
                supabase.table("section")
                .select("section_id, course(course_code, course_name), enrollment(student_id, status)")
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
                        f"- {course.get('course_code', 'Unknown')}: {len(enrollments)} student(s)"
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

    # FALLBACK: vector DB / LLM
    try:
        from services.ai_services import AIService
        result = AIService.answer_question(role, question, user_id)

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