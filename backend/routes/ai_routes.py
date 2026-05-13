from flask import Blueprint, request, jsonify
from services.ai_services import AIService

ai_bp = Blueprint("ai_bp", __name__)

@ai_bp.route("/ai/ask", methods=["POST"])
def ask_ai():
    data = request.get_json()

    role = data.get("role", "visitor")
    question = data.get("question")
    user_id = data.get("user_id")

    if not question:
        return jsonify({
            "success": False,
            "message": "Question is required."
        }), 400

    result = AIService.answer_question(role, question, user_id)

    return jsonify({
        "success": True,
        "role": role,
        "question": question,
        "result": result
    })