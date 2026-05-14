from flask import Blueprint, jsonify, request

from services.auth_service import AuthService

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get("identifier") or data.get("username") or data.get("email") or ""
    password = data.get("password") or ""

    result, status_code = AuthService.login(identifier, password)
    return jsonify(result), status_code
