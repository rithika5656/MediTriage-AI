"""
Agentic API routes for the multi-agent healthcare workflow.
"""
from __future__ import annotations

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.agent_service import agent_service


agent_bp = Blueprint("agents", __name__)


@agent_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Message is required"}), 400
    return jsonify(agent_service.process_chat(user_id=user_id, message=message)), 200


@agent_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_document():
    user_id = int(get_jwt_identity())
    if "file" not in request.files:
        return jsonify({"error": "A PDF file is required"}), 400
    result = agent_service.upload_document(request.files["file"], user_id=user_id)
    return jsonify(result), 200


@agent_bp.route("/generate-report", methods=["POST"])
@jwt_required()
def generate_report():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    result = agent_service.generate_report(user_id=user_id, message=data.get("message"))
    return jsonify(result), 200


@agent_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    limit = request.args.get("limit", 25, type=int)
    return jsonify(agent_service.get_history(user_id=user_id, limit=limit)), 200


@agent_bp.route("/agents/status", methods=["GET"])
@jwt_required()
def agent_status():
    return jsonify(agent_service.get_agent_status()), 200


@agent_bp.route("/reports/<path:filename>", methods=["GET"])
@jwt_required()
def download_report(filename: str):
    from database import REPORT_DIR

    return send_file(REPORT_DIR / filename, as_attachment=True)
