from flask import Blueprint, jsonify, request

from services.prn_service import executar_prn

prn_bp = Blueprint("prn", __name__)


@prn_bp.route("/geral_prn", methods=["POST"])
def geral_prn():
    payload = request.get_json(silent=True) or {}
    resultado = executar_prn(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
