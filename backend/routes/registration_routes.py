from flask import Blueprint, jsonify, request
from services.registration_service import RegistrationService
from services.supabase_client import supabase

registration_bp = Blueprint("registration_bp", __name__)


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

    if not section_ids:
        return jsonify({
            "success": False,
            "message": "section_ids are required."
        }), 400

    result = RegistrationService.register_student(student_id, section_ids)
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

    result = RegistrationService.drop_student(student_id, section_id)
    status_code = 200 if result["success"] else 400

    return jsonify(result), status_code


@registration_bp.route("/registration/enrollments", methods=["GET"])
def get_enrollments():
    response = (
        supabase.table("enrollment")
        .select("*, section(*, course(*))")
        .execute()
    )
    return jsonify(response.data)


@registration_bp.route("/registration/student/<int:student_id>", methods=["GET"])
def get_student_enrollments(student_id):
    response = (
        supabase.table("enrollment")
        .select("*, section(*, course(*))")
        .eq("student_id", student_id)
        .execute()
    )

    return jsonify(response.data)

@registration_bp.route("/registration/waitlist/admit", methods=["POST"])
def admit_waitlisted_student():
    data = request.get_json()

    result = RegistrationService.admit_from_waitlist(
        data.get("instructor_id"),
        data.get("section_id"),
        data.get("student_id")
    )

    return jsonify(result), 200 if result["success"] else 400

@registration_bp.route("/registration/cancel-low-enrollment", methods=["POST"])
def cancel_low_enrollment():
    result = RegistrationService.cancel_low_enrollment_sections()
    return jsonify(result)

@registration_bp.route("/registration/warn-low-load", methods=["POST"])
def warn_low_load_students():
    result = RegistrationService.warn_students_with_low_course_load()
    return jsonify(result)


@registration_bp.route("/registration/period", methods=["POST"])
def update_registration_period():
    data = request.get_json()

    period = data.get("period")

    if not period:
        return jsonify({
            "success": False,
            "message": "period is required."
        }), 400

    result = RegistrationService.set_current_period(period)
    return jsonify(result), 200 if result["success"] else 400


@registration_bp.route("/registration/suspend-cancelled-instructors", methods=["POST"])
def suspend_cancelled_instructors():
    result = RegistrationService.suspend_instructors_with_all_courses_cancelled()
    return jsonify(result)