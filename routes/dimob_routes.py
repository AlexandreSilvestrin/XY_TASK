from flask import Blueprint, jsonify, request

from services.dimob_service import executar_dimob

dimob_bp = Blueprint("dimob", __name__)


@dimob_bp.route("/transformar_dimob", methods=["POST"])
def transformar_dimob():
    payload = request.get_json(silent=True) or {}
    resultado = executar_dimob(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
