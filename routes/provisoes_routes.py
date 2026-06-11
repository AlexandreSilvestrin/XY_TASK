from flask import Blueprint, jsonify, request

from services.codigos_service import buscar_codigos_consorcio, salvar_codigos_consorcio
from services.provisoes_service import executar_provisoes

provisoes_bp = Blueprint("provisoes", __name__)


@provisoes_bp.route("/transformar_provisoes", methods=["POST"])
def transformar_provisoes():
    payload = request.get_json(silent=True) or {}
    resultado = executar_provisoes(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@provisoes_bp.route("/buscar_codigos_consorcio", methods=["POST"])
def buscar_codigos_consorcio_route():
    payload = request.get_json(silent=True) or {}
    resultado = buscar_codigos_consorcio(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@provisoes_bp.route("/salvar_codigos_consorcio", methods=["POST"])
def salvar_codigos_consorcio_route():
    payload = request.get_json(silent=True) or {}
    resultado = salvar_codigos_consorcio(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
