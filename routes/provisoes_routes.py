from flask import Blueprint, jsonify, request

from services.provisoes_service import executar_provisoes

provisoes_bp = Blueprint("provisoes", __name__)


@provisoes_bp.route("/transformar_provisoes", methods=["POST"])
def transformar_provisoes():
    payload = request.get_json(silent=True) or {}
    resultado = executar_provisoes(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
