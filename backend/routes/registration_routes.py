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