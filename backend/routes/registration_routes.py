from flask import Blueprint, jsonify, request
from routes.course_routes import sections, semester, enrollments
from services.registration_service import RegistrationService
from services.schedule_service import ScheduleService

registration_bp = Blueprint("registration_bp", __name__)


@registration_bp.route("/registration/schedules", methods=["POST"])
def generate_schedules():
    data = request.get_json()
    course_ids = data.get("course_ids", [])

    if len(course_ids) < 2 or len(course_ids) > 4:
        return jsonify({
            "success": False,
            "message": "Please select between 2 and 4 courses."
        }), 400

    sections_by_course = []

    for course_id in course_ids:
        matching_sections = [section for section in sections if section.course_id == course_id]
        if not matching_sections:
            return jsonify({
                "success": False,
                "message": f"No sections found for course {course_id}."
            }), 404
        sections_by_course.append(matching_sections)

    valid_schedules = ScheduleService.generate_possible_schedules(sections_by_course)

    return jsonify({
        "success": True,
        "count": len(valid_schedules),
        "schedules": ScheduleService.schedules_to_dict(valid_schedules)
    })


@registration_bp.route("/registration/register", methods=["POST"])
def register():
    data = request.get_json()
    student_id = data.get("student_id")
    section_ids = data.get("section_ids", [])

    if not student_id:
        return jsonify({
            "success": False,
            "message": "student_id is required."
        }), 400

    selected_sections = []
    for section_id in section_ids:
        found_section = next((section for section in sections if section.section_id == section_id), None)
        if not found_section:
            return jsonify({
                "success": False,
                "message": f"Section {section_id} not found."
            }), 404
        selected_sections.append(found_section)

    result = RegistrationService.register_student(
        student_id,
        selected_sections,
        semester,
        enrollments
    )

    status_code = 200 if result["success"] else 400
    return jsonify(result), status_code


@registration_bp.route("/registration/drop", methods=["POST"])
def drop():
    data = request.get_json()
    student_id = data.get("student_id")
    section_id = data.get("section_id")

    if not student_id or not section_id:
        return jsonify({
            "success": False,
            "message": "student_id and section_id are required."
        }), 400

    found_section = next((section for section in sections if section.section_id == section_id), None)
    if not found_section:
        return jsonify({
            "success": False,
            "message": f"Section {section_id} not found."
        }), 404

    result = RegistrationService.drop_student(student_id, found_section, enrollments)
    status_code = 200 if result["success"] else 400

    return jsonify(result), status_code


@registration_bp.route("/registration/waitlist/<section_id>", methods=["GET"])
def get_waitlist(section_id):
    found_section = next((section for section in sections if section.section_id == section_id), None)

    if not found_section:
        return jsonify({
            "success": False,
            "message": f"Section {section_id} not found."
        }), 404

    return jsonify({
        "success": True,
        "section_id": found_section.section_id,
        "waitlist": found_section.waitlist
    })


@registration_bp.route("/registration/enrollments", methods=["GET"])
def get_enrollments():
    return jsonify([enrollment.to_dict() for enrollment in enrollments])