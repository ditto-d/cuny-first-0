from services.supabase_client import supabase
from flask import Blueprint, jsonify, request
course_bp = Blueprint("course_bp", __name__)


@course_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend is running"})


@course_bp.route("/courses", methods=["GET"])
def get_courses():
    response = supabase.table("course").select("*").execute()
    return jsonify(response.data)


@course_bp.route("/sections", methods=["GET"])
def get_sections():

    response = (
        supabase.table("section")
        .select("*, course(*)")
        .execute()
    )

    return jsonify(response.data)


@course_bp.route("/instructors/<int:instructor_id>/sections", methods=["GET"])
def get_instructor_sections(instructor_id):
    response = (
        supabase.table("section")
        .select("*, course(*)")
        .eq("instructor_id", instructor_id)
        .execute()
    )

    sections = response.data or []
    for section in sections:
        enrollments = (
            supabase.table("enrollment")
            .select("enrollment_id,status")
            .eq("section_id", section["section_id"])
            .execute()
            .data or []
        )
        section["enrolled_count"] = len([
            enrollment for enrollment in enrollments
            if enrollment.get("status", "enrolled") == "enrolled"
        ])
        section["waitlisted_count"] = len([
            enrollment for enrollment in enrollments
            if enrollment.get("status") == "waitlisted"
        ])

    return jsonify({"success": True, "sections": sections})


@course_bp.route("/sections/<int:section_id>", methods=["GET"])
def get_section(section_id):

    response = (
        supabase.table("section")
        .select("*, course(*)")
        .eq("section_id", section_id)
        .execute()
    )

    if not response.data:
        return jsonify({
            "success": False,
            "message": "Section not found."
        }), 404

    return jsonify(response.data[0])


@course_bp.route("/sections/<int:section_id>/roster", methods=["GET"])
def get_section_roster(section_id):
    section_response = (
        supabase.table("section")
        .select("section_id,instructor_id,course(*)")
        .eq("section_id", section_id)
        .limit(1)
        .execute()
    )

    if not section_response.data:
        return jsonify({
            "success": False,
            "message": "Section not found."
        }), 404

    enrollments_response = (
        supabase.table("enrollment")
        .select("*, student(*, account(*)), grade(*)")
        .eq("section_id", section_id)
        .execute()
    )

    return jsonify({
        "success": True,
        "section": section_response.data[0],
        "enrollments": enrollments_response.data or [],
    })


@course_bp.route("/students", methods=["GET"])
def get_students():
    try:
        response = (
            supabase.table("student")
            .select("*, account(*)")
            .execute()
        )
        return jsonify({"success": True, "students": response.data or []})
    except Exception:
        response = (
            supabase.table("account")
            .select("*")
            .eq("account_type", "student")
            .execute()
        )
        return jsonify({"success": True, "students": response.data or []})
@course_bp.route("/sections", methods=["POST"])
def create_section():

    data = request.get_json() or {}

    required = [
        "course_id",
        "semester_id",
        "instructor_id",
        "schedule",
        "room",
        "seats"
    ]

    missing = [field for field in required if data.get(field) is None]

    if missing:
        return jsonify({
            "success": False,
            "message": f"Missing fields: {', '.join(missing)}"
        }), 400

    response = (
        supabase.table("section")
        .insert({
            "course_id": data["course_id"],
            "semester_id": data["semester_id"],
            "instructor_id": data["instructor_id"],
            "schedule": data["schedule"],
            "room": data["room"],
            "seats": data["seats"],
            "status": data.get("status", "active")
        })
        .execute()
    )

    return jsonify({
        "success": True,
        "message": "Section created successfully.",
        "section": response.data[0] if response.data else None
    }), 201


@course_bp.route("/sections/<int:section_id>", methods=["PUT"])
def update_section(section_id):

    data = request.get_json() or {}

    allowed_fields = [
        "course_id",
        "semester_id",
        "instructor_id",
        "schedule",
        "room",
        "seats",
        "status"
    ]

    updates = {
        field: data[field]
        for field in allowed_fields
        if field in data
    }

    if not updates:
        return jsonify({
            "success": False,
            "message": "No fields provided to update."
        }), 400

    response = (
        supabase.table("section")
        .update(updates)
        .eq("section_id", section_id)
        .execute()
    )

    return jsonify({
        "success": True,
        "message": "Section updated successfully.",
        "section": response.data[0] if response.data else None
    })


@course_bp.route("/sections/<int:section_id>", methods=["DELETE"])
def delete_section(section_id):

    response = (
        supabase.table("section")
        .delete()
        .eq("section_id", section_id)
        .execute()
    )

    return jsonify({
        "success": True,
        "message": "Section deleted successfully."
    })
