from flask import Blueprint, jsonify, request

from services.cnpj_service import (
    buscar_banco_cnpj,
    iniciar_pesquisa,
    listar_cnpjs_sem_nome,
    parar_pesquisa,
    salvar_banco_cnpj,
    salvar_cnpjs,
)

cnpj_bp = Blueprint("cnpj", __name__)


@cnpj_bp.route("/pesquisar_cnpj", methods=["POST"])
def pesquisar_cnpj():
    payload = request.get_json(silent=True) or {}
    resultado = listar_cnpjs_sem_nome(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@cnpj_bp.route("/iniciar_pesquisa_cnpj", methods=["POST"])
def iniciar_pesquisa_cnpj():
    payload = request.get_json(silent=True) or {}
    resultado = iniciar_pesquisa(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@cnpj_bp.route("/parar_pesquisa_cnpj", methods=["POST"])
def parar_pesquisa_cnpj():
    resultado = parar_pesquisa()
    return jsonify(resultado), 200


@cnpj_bp.route("/salvar_cnpj", methods=["POST"])
def salvar_cnpj():
    payload = request.get_json(silent=True) or {}
    resultado = salvar_cnpjs(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@cnpj_bp.route("/buscar_banco_cnpj", methods=["POST"])
def buscar_banco_cnpj_route():
    payload = request.get_json(silent=True) or {}
    resultado = buscar_banco_cnpj(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@cnpj_bp.route("/salvar_banco_cnpj", methods=["POST"])
def salvar_banco_cnpj_route():
    payload = request.get_json(silent=True) or {}
    resultado = salvar_banco_cnpj(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
