from flask import Blueprint, jsonify, request

from models.application import Application
from services.application_service import ApplicationService

application_bp = Blueprint("application_bp", __name__, url_prefix="/applications")


@application_bp.route("", methods=["GET"])
def list_applications():
    result, status_code = ApplicationService.list_applications(request.args.get("status"))
    return jsonify(result), status_code


def _build_application(application_type: str) -> tuple[Application | None, dict[str, str]]:
    errors: dict[str, str] = {}
    form = request.form

    first_name = (form.get("first_name") or "").strip()
    last_name = (form.get("last_name") or "").strip()
    email = (form.get("email") or "").strip().lower()
    gpa_value = (form.get("gpa") or "").strip()

    if not first_name:
        errors["first_name"] = "First name is required."
    if not last_name:
        errors["last_name"] = "Last name is required."
    if not email:
        errors["email"] = "Email is required."

    gpa = None
    if application_type == "student":
        if not gpa_value:
            errors["gpa"] = "GPA is required."
        else:
            try:
                gpa = float(gpa_value)
                if gpa < 0 or gpa > 4.0:
                    errors["gpa"] = "GPA must be between 0.0 and 4.0."
            except ValueError:
                errors["gpa"] = "GPA must be a number."

    document = request.files.get("transcript") or request.files.get("resume")
    if not document:
        errors["document"] = "A PDF document is required."

    if errors:
        return None, errors

    return Application(
        application_type=application_type,
        first_name=first_name,
        last_name=last_name,
        email=email,
        gpa=gpa,
        document_name=document.filename if document else None,
    ), {}


@application_bp.route("/student", methods=["POST"])
def submit_student_application():
    application, errors = _build_application("student")
    if errors:
        return jsonify({"success": False, "message": "Please fix the form errors.", "errors": errors}), 400

    result, status_code = ApplicationService.submit_application(application)
    return jsonify(result), status_code


@application_bp.route("/instructor", methods=["POST"])
def submit_instructor_application():
    application, errors = _build_application("instructor")
    if errors:
        return jsonify({"success": False, "message": "Please fix the form errors.", "errors": errors}), 400

    result, status_code = ApplicationService.submit_application(application)
    return jsonify(result), status_code


@application_bp.route("/<int:admission_id>", methods=["GET"])
def get_application_review(admission_id: int):
    review_data = {
        "application_type": request.args.get("application_type"),
        "program_id": request.args.get("program_id"),
    }
    result, status_code = ApplicationService.get_application_review(admission_id, review_data)
    return jsonify(result), status_code


@application_bp.route("/<int:admission_id>/approve", methods=["POST"])
def approve_application(admission_id: int):
    data = request.get_json(silent=True) or {}

    try:
        result, status_code = ApplicationService.approve_application(admission_id, data)
    except RuntimeError as error:
        return jsonify({"success": False, "message": str(error)}), 500

    return jsonify(result), status_code


@application_bp.route("/<int:admission_id>/reject", methods=["POST"])
def reject_application(admission_id: int):
    data = request.get_json(silent=True) or {}

    result, status_code = ApplicationService.reject_application(admission_id, data)
    return jsonify(result), status_code
