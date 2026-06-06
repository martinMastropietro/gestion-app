from collections import defaultdict
from datetime import date
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
from modules.configuracion.routes import get_config_value

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
        total_pagos_monto = sum(to_decimal(p.get("monto")) for p in pagos)
        deuda_total = max(total_expensas - total_pagos_monto, Decimal("0"))

        # Mora: FIFO allocation per period
        mora_porcentaje = get_config_value("mora_porcentaje_mensual")
        today = date.today()
        sorted_expensas = sorted(expensas, key=lambda e: (e["year"], e["mes"]))
        remaining = total_pagos_monto
        mora_total = Decimal("0")
        expensas_con_mora = []

        for exp in sorted_expensas:
            monto = to_decimal(exp.get("monto"))
            if remaining >= monto:
                remaining -= monto
                saldo = Decimal("0")
                mora_periodo = Decimal("0")
            else:
                saldo = monto - remaining
                remaining = Decimal("0")
                due_date = last_day_for_period(exp["mes"], exp["year"])
                if today > due_date and mora_porcentaje > 0:
                    months_overdue = max(
                        0,
                        (today.year * 12 + today.month) - (exp["year"] * 12 + exp["mes"]),
                    )
                    mora_periodo = saldo * mora_porcentaje / Decimal("100") * months_overdue
                else:
                    mora_periodo = Decimal("0")
                mora_total += mora_periodo

            expensas_con_mora.append({
                **exp,
                "monto": money(exp.get("monto")),
                "mora": money(mora_periodo),
            })

        return jsonify({
            "unidad": unidad,
            "deuda_total": money(deuda_total),
            "mora_total": money(mora_total),
            "deuda_con_mora": money(deuda_total + mora_total),
            "mora_porcentaje_mensual": float(mora_porcentaje),
            "expensas": expensas_con_mora,
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
