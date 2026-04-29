from collections import defaultdict
from decimal import Decimal

from flask import Blueprint, jsonify, request

from database import supabase
from modules.common import (
    execute_with_retry,
    last_day_for_period,
    money,
    parse_iso_date,
    parse_positive_amount,
    require_role,
    to_decimal,
)

inquilino_bp = Blueprint("inquilino", __name__)


@inquilino_bp.get("/deuda")
@require_role("inquilino")
def get_mi_deuda():
    """Return the authenticated tenant's expense and payment history."""
    unidad_id = request.current_user.get("unidad_id")
    if not unidad_id:
        return jsonify({"error": "Tu cuenta no está vinculada a ninguna unidad"}), 400

    try:
        unidad_res = execute_with_retry(
            supabase.table("unidades")
            .select("id, piso, apartamento, nombre_responsable, superficie")
            .eq("id", unidad_id)
        )
        expensas_res = execute_with_retry(
            supabase.table("expensas")
            .select("id, mes, year, monto, porcentaje")
            .eq("unidad_id", unidad_id)
            .order("year", desc=True)
            .order("mes", desc=True)
        )
        pagos_res = execute_with_retry(
            supabase.table("pagos")
            .select("id, fecha_pago, mes, year, monto, observacion")
            .eq("unidad_id", unidad_id)
            .order("fecha_pago", desc=True)
        )

        unidad = unidad_res.data[0] if unidad_res.data else None
        expensas = expensas_res.data or []
        pagos = pagos_res.data or []

        total_expensas = sum(to_decimal(e.get("monto")) for e in expensas)
        total_pagos = sum(to_decimal(p.get("monto")) for p in pagos)
        deuda_total = max(total_expensas - total_pagos, Decimal("0"))

        return jsonify({
            "unidad": unidad,
            "deuda_total": money(deuda_total),
            "expensas": [{**e, "monto": money(e.get("monto"))} for e in expensas],
            "pagos": [{**p, "monto": money(p.get("monto"))} for p in pagos],
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inquilino_bp.post("/pago")
@require_role("inquilino")
def registrar_mi_pago():
    """Let a tenant register a payment against their own unit only."""
    unidad_id = request.current_user.get("unidad_id")
    if not unidad_id:
        return jsonify({"error": "Tu cuenta no está vinculada a ninguna unidad"}), 400

    data = request.get_json(silent=True) or {}
    fecha_pago = parse_iso_date(data.get("fecha_pago"))
    monto = parse_positive_amount(data.get("monto"))
    observacion = (data.get("observacion") or "").strip() or None

    if not fecha_pago or monto is None:
        return jsonify({"error": "fecha_pago y monto positivo son requeridos"}), 400

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
            return jsonify({"error": "No se pudo registrar el pago"}), 400

        pago = res.data[0]
        pago["monto"] = money(pago.get("monto"))
        return jsonify(pago), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
