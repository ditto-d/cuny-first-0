from flask import Blueprint, request, jsonify
from supabase import create_client
import os

#File: Handles grade submission, retrieval, GPA calculation, course reviews, and complaints.

# Import service functions
from services.grades_service import (
    submit_grade, get_grades, get_gpa,
    recalculate_gpa, evaluate_academic_standing,
    check_class_gpa, apply_for_graduation, review_graduation,
)
from services.reviews_service import submit_review
from services.complaints_service import submit_complaint, resolve_complaint
 
grades_bp = Blueprint("grades", __name__)
 
# Helper function to create Supabase client
def get_supabase():
    #Create a Supabase client using environment variables.
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
 
# Grades

@grades_bp.route("/grades/submit", methods=["POST"])
def route_submit_grade():

    #POST /api/grades/submit
    #Body: { instructor_id, section_id, student_id, letter_grade }

    data = request.get_json()
    result = submit_grade(
        get_supabase(),
        instructor_id=data.get("instructor_id"),
        section_id=data.get("section_id"),
        student_id=data.get("student_id"),
        letter_grade=data.get("letter_grade"),
    )
    return jsonify(result), (200 if result["success"] else 400)

 
@grades_bp.route("/grades/<int:student_id>", methods=["GET"])
def route_get_grades(student_id):
    #GET /api/grades/<student_id>
    #Returns all recorded grades for the student.
    grades = get_grades(get_supabase(), student_id)
    return jsonify({"success": True, "grades": grades}), 200
 
 
@grades_bp.route("/gpa/<int:student_id>", methods=["GET"])
def route_get_gpa(student_id):
    #GET /api/gpa/<student_id>
    #Returns the student's current cumulative GPA.
    result = get_gpa(get_supabase(), student_id)
    return jsonify(result), (200 if result["success"] else 404)
 
 
@grades_bp.route("/gpa/<int:student_id>/recalculate", methods=["POST"])
def route_recalculate_gpa(student_id):
    #POST /api/gpa/<student_id>/recalculate
    #Forces a fresh GPA calculation (useful for admin/testing).
    result = recalculate_gpa(get_supabase(), student_id)
    return jsonify({"success": True, **result}), 200
 
 
# Academic standing
 
@grades_bp.route("/standing/<int:student_id>/evaluate", methods=["POST"])
def route_evaluate_standing(student_id):
    #POST /api/standing/<student_id>/evaluate
    #Re-evaluates and updates a student's academic standing.
    result = evaluate_academic_standing(get_supabase(), student_id)
    return jsonify({"success": True, **result}), 200
 
 
# Reviews
 
@grades_bp.route("/reviews/submit", methods=["POST"])
def route_submit_review():
    #POST /api/reviews/submit
    #Body: { student_id, course_id, rating (int 1-5), comment_text }
    data = request.get_json()
    result = submit_review(
        get_supabase(),
        student_id=data.get("student_id"),
        course_id=data.get("course_id"),
        rating=data.get("rating"),
        comment_text=data.get("comment_text", ""),
    )
    return jsonify(result), (200 if result["success"] else 400)
 
 

# Complaints

@grades_bp.route("/complaints/submit", methods=["POST"])
def route_submit_complaint():
    #POST /api/complaints/submit
    #Body: { complainant_id, complainant_role, target_id, description }

    data = request.get_json()
    result = submit_complaint(
        get_supabase(),
        complainant_id=data.get("complainant_id"),
        complainant_role=data.get("complainant_role"),
        target_id=data.get("target_id"),
        description=data.get("description"),
    )
    return jsonify(result), (200 if result["success"] else 400)
 
 
@grades_bp.route("/complaints/<int:complaint_id>/resolve", methods=["POST"])
def route_resolve_complaint(complaint_id):
    #POST /api/complaints/<complaint_id>/resolve
    #Body: { registrar_id, action, justification }
    #action must be: 'warn_subject' | 'warn_complainant' | 'dismiss'

    data = request.get_json()
    result = resolve_complaint(
        get_supabase(),
        complaint_id=complaint_id,
        registrar_id=data.get("registrar_id"),
        action=data.get("action"),
        justification=data.get("justification", ""),
    )
    return jsonify(result), (200 if result["success"] else 400)

# Class GPA Check

@grades_bp.route("/sections/<int:section_id>/class-gpa", methods=["POST"])
def route_check_class_gpa(section_id):
    #POST /api/sections/<section_id>/class-gpa
    #Calculates class average GPA and flags instructor if outside range (2.5 - 3.5).
    result = check_class_gpa(get_supabase(), section_id)
    return jsonify(result), 200


# Graduation

@grades_bp.route("/graduation/apply", methods=["POST"])
def route_apply_for_graduation():
    #POST /api/graduation/apply
    #Body: { student_id }
    data = request.get_json()
    result = apply_for_graduation(get_supabase(), student_id=data.get("student_id"))
    return jsonify(result), (200 if result["success"] else 400)


@grades_bp.route("/graduation/<int:application_id>/review", methods=["POST"])
def route_review_graduation(application_id):
    #POST /api/graduation/<application_id>/review
    #Body: { registrar_id, approved (bool), justification }
    data = request.get_json()
    result = review_graduation(
        get_supabase(),
        application_id=application_id,
        registrar_id=data.get("registrar_id"),
        approved=data.get("approved"),
        justification=data.get("justification", ""),
    )
    return jsonify(result), (200 if result["success"] else 400)