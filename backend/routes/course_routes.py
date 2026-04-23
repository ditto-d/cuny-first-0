from flask import Blueprint, jsonify
from models.course import Course
from models.section import Section
from models.semester import Semester

course_bp = Blueprint("course_bp", __name__)

semester = Semester("Spring 2026", "registration")

courses = [
    Course("CSC101", "Intro to Computer Science", 3, "Foundations of computing."),
    Course("MAT201", "Calculus I", 4, "Limits, derivatives, and integrals."),
    Course("PHY101", "Physics I", 4, "Introductory mechanics.")
]

sections = [
    Section("S1", "CSC101", "I1", "Mon 9AM", 2, semester.name),
    Section("S2", "CSC101", "I1", "Tue 10AM", 2, semester.name),
    Section("S3", "MAT201", "I2", "Mon 9AM", 2, semester.name),
    Section("S4", "MAT201", "I2", "Wed 11AM", 2, semester.name),
    Section("S5", "PHY101", "I3", "Tue 10AM", 2, semester.name),
    Section("S6", "PHY101", "I3", "Thu 1PM", 2, semester.name),
]

enrollments = []


@course_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend is running"})


@course_bp.route("/courses", methods=["GET"])
def get_courses():
    return jsonify([course.to_dict() for course in courses])


@course_bp.route("/sections", methods=["GET"])
def get_sections():
    return jsonify([section.to_dict() for section in sections])


@course_bp.route("/semester", methods=["GET"])
def get_semester():
    return jsonify(semester.to_dict())