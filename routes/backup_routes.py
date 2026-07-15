from flask import Blueprint, jsonify

from services.backup_service import criar_backup, importar_backup

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
