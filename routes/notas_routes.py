from flask import Blueprint, jsonify, request

from services.notas_service import (
    executar_faturamento,
    executar_notas,
    exportar_banco_cnpj,
    importar_banco_cnpj,
)
from services.porcentagem_service import (
    pesquisar_guia_porcentagem,
    salvar_guia_porcentagem,
)

notas_bp = Blueprint("notas", __name__)


@notas_bp.route("/geral_notas", methods=["POST"])
def geral_notas():
    payload = request.get_json(silent=True) or {}
    resultado = executar_notas(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@notas_bp.route("/exportar_banco", methods=["POST"])
def exportar_banco():
    resultado = exportar_banco_cnpj()
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@notas_bp.route("/importar_banco", methods=["POST"])
def importar_banco():
    resultado = importar_banco_cnpj()
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@notas_bp.route("/gerar_faturamento", methods=["POST"])
def gerar_faturamento():
    payload = request.get_json(silent=True) or {}
    resultado = executar_faturamento(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@notas_bp.route("/adicionar_porcentagem", methods=["POST"])
def adicionar_porcentagem():
    return jsonify({"success": True, "message": "Modal de porcentagens."}), 200


@notas_bp.route("/pesquisar_guia_porcentagem", methods=["POST"])
def pesquisar_guia_porcentagem_route():
    payload = request.get_json(silent=True) or {}
    resultado = pesquisar_guia_porcentagem(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code


@notas_bp.route("/salvar_guia_porcentagem", methods=["POST"])
def salvar_guia_porcentagem_route():
    payload = request.get_json(silent=True) or {}
    resultado = salvar_guia_porcentagem(payload)
    status_code = 200 if resultado.get("success") else 400
    return jsonify(resultado), status_code
