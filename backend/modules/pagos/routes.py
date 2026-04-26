from flask import Blueprint, jsonify, request

from database import supabase
from modules.common import money, parse_iso_date, parse_positive_amount

pagos_bp = Blueprint("pagos", __name__)


@pagos_bp.get("/")
def listar_pagos():
    unidad_id = request.args.get("unidad_id")

    try:
        query = (
            supabase.table("pagos")
            .select("id, unidad_id, fecha_pago, mes, year, monto, observacion")
            .order("fecha_pago", desc=True)
        )

        if unidad_id:
            query = query.eq("unidad_id", unidad_id)

        res = query.execute()
        pagos = res.data or []
        return jsonify([{**pago, "monto": money(pago.get("monto"))} for pago in pagos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pagos_bp.post("/")
def crear_pago():
    data = request.get_json(silent=True) or {}
    unidad_id = (data.get("unidad_id") or "").strip()
    fecha_pago = parse_iso_date(data.get("fecha_pago"))
    monto = parse_positive_amount(data.get("monto"))
    observacion = (data.get("observacion") or "").strip() or None

    if not unidad_id or not fecha_pago or monto is None:
        return jsonify({"error": "unidad_id, fecha_pago y monto positivo son requeridos"}), 400

    payload = {
        "unidad_id": unidad_id,
        "fecha_pago": fecha_pago.isoformat(),
        "mes": fecha_pago.month,
        "year": fecha_pago.year,
        "monto": str(monto),
        "observacion": observacion,
    }

    try:
        res = supabase.table("pagos").insert(payload).execute()
        if not res.data:
            return jsonify({"error": "No se pudo crear el pago"}), 400

        pago = res.data[0]
        pago["monto"] = money(pago.get("monto"))
        return jsonify(pago), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@pagos_bp.delete("/<string:pago_id>")
def eliminar_pago(pago_id):
    try:
        res = supabase.table("pagos").delete().eq("id", pago_id).execute()
        if not res.data:
            return jsonify({"error": "Pago no encontrado"}), 404
        return jsonify({"message": "Pago eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
