from flask import Blueprint, jsonify
from services.supabase_client import supabase

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