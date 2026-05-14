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


@auth_bp.route("/change-password", methods=["POST"])
def change_password():
    data = request.get_json(silent=True) or {}
    auth_header = request.headers.get("Authorization", "")
    bearer_token = auth_header.removeprefix("Bearer ").strip() if auth_header.startswith("Bearer ") else ""
    access_token = bearer_token or data.get("access_token") or ""
    new_password = data.get("new_password") or ""

    result, status_code = AuthService.change_password(access_token, new_password)
    return jsonify(result), status_code
