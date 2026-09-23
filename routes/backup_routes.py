from flask import Blueprint, jsonify, request

from services.backup_service import criar_backup, importar_backup
from services.banco_rede_service import (
    cancelar_envio,
    descobrir_computadores,
    iniciar_envio,
    receber_banco,
    status_envio,
)

backup_bp = Blueprint("backup", __name__)


@backup_bp.route("/criar_backup", methods=["POST"])
def criar_backup_route():
    resultado = criar_backup()
    if resultado.get("success") or resultado.get("cancelled"):
        return jsonify(resultado), 200
    return jsonify(resultado), 400


@backup_bp.route("/importar_backup", methods=["POST"])
def importar_backup_route():
    resultado = importar_backup()
    if resultado.get("success") or resultado.get("cancelled"):
        return jsonify(resultado), 200
    return jsonify(resultado), 400


@backup_bp.route("/banco_rede/iniciar_envio", methods=["POST"])
def banco_rede_iniciar_envio():
    resultado = iniciar_envio()
    status = 200 if resultado.get("success") else 400
    return jsonify(resultado), status


@backup_bp.route("/banco_rede/status_envio", methods=["GET"])
def banco_rede_status_envio():
    return jsonify(status_envio()), 200


@backup_bp.route("/banco_rede/cancelar_envio", methods=["POST"])
def banco_rede_cancelar_envio():
    resultado = cancelar_envio()
    status = 200 if resultado.get("success") else 400
    return jsonify(resultado), status


@backup_bp.route("/banco_rede/descobrir", methods=["POST"])
def banco_rede_descobrir():
    return jsonify(descobrir_computadores()), 200


@backup_bp.route("/banco_rede/receber", methods=["POST"])
def banco_rede_receber():
    data = request.json or {}
    ip = str(data.get("ip") or "")
    resultado = receber_banco(ip)
    status = 200 if resultado.get("success") else 400
    return jsonify(resultado), status
