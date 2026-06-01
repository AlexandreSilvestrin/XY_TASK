from flask import Blueprint, jsonify, request

from services.razao_service import executar_razao

razao_bp = Blueprint("razao", __name__)


@razao_bp.route("/transformar_razao", methods=["POST"])
def transformar_razao():
    payload = request.get_json(silent=True) or {}
    resultado = executar_razao(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
