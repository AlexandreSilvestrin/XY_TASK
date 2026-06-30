from flask import Blueprint, jsonify, request

from services.apuracao_service import (
    buscar_codigos_apuracao,
    executar_apuracao,
    listar_consorcios_apuracao,
    listar_empresas_apuracao,
    salvar_codigos_apuracao,
)

apuracao_bp = Blueprint("apuracao", __name__)


@apuracao_bp.route("/transformar_apuracao", methods=["POST"])
def transformar_apuracao():
    payload = request.get_json(silent=True) or {}
    resultado = executar_apuracao(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@apuracao_bp.route("/listar_empresas_apuracao", methods=["GET"])
def listar_empresas_apuracao_route():
    resultado = listar_empresas_apuracao()
    return jsonify(resultado), 200


@apuracao_bp.route("/listar_consorcios_apuracao", methods=["POST"])
def listar_consorcios_apuracao_route():
    payload = request.get_json(silent=True) or {}
    resultado = listar_consorcios_apuracao(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@apuracao_bp.route("/buscar_codigos_apuracao", methods=["POST"])
def buscar_codigos_apuracao_route():
    payload = request.get_json(silent=True) or {}
    resultado = buscar_codigos_apuracao(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@apuracao_bp.route("/salvar_codigos_apuracao", methods=["POST"])
def salvar_codigos_apuracao_route():
    payload = request.get_json(silent=True) or {}
    resultado = salvar_codigos_apuracao(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
