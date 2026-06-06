from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request

from database import supabase

configuracion_bp = Blueprint("configuracion", __name__)

ALLOWED_KEYS = {"comision_porcentaje", "mora_porcentaje_mensual"}


def get_config_value(clave, default=Decimal("0")):
    try:
        res = supabase.table("configuracion").select("valor").eq("clave", clave).single().execute()
        return Decimal(str(res.data["valor"])) if res.data else default
    except Exception:
        return default


@configuracion_bp.get("/")
def get_configuracion():
    try:
        res = supabase.table("configuracion").select("clave, valor, descripcion").execute()
        return jsonify({row["clave"]: float(row["valor"]) for row in (res.data or [])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@configuracion_bp.patch("/")
def update_configuracion():
    data = request.get_json(silent=True) or {}
    field_errors = {}
    updates = {}

    for key in ALLOWED_KEYS:
        if key not in data:
            continue
        try:
            value = Decimal(str(data[key]))
        except (InvalidOperation, TypeError, ValueError):
            field_errors[key] = "Valor inválido"
            continue
        if value < 0 or value > 100:
            field_errors[key] = "El valor debe estar entre 0 y 100"
            continue
        updates[key] = value

    if field_errors:
        return jsonify({"error": field_errors}), 400
    if not updates:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    try:
        now = datetime.now(timezone.utc).isoformat()
        for key, value in updates.items():
            supabase.table("configuracion").update(
                {"valor": str(value), "updated_at": now}
            ).eq("clave", key).execute()

        res = supabase.table("configuracion").select("clave, valor, descripcion").execute()
        return jsonify({row["clave"]: float(row["valor"]) for row in (res.data or [])}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
