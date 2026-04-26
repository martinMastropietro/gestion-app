from collections import defaultdict
from decimal import Decimal

from flask import Blueprint, jsonify

from database import supabase
from modules.common import execute_with_retry, money, to_decimal

overview_bp = Blueprint("overview", __name__)


def load_debt_by_unit():
    unidades_res = execute_with_retry(
        supabase.table("unidades")
        .select("id, piso, apartamento, nombre_responsable")
        .order("piso")
        .order("apartamento")
    )
    expensas_res = execute_with_retry(supabase.table("expensas").select("unidad_id, monto"))
    pagos_res = execute_with_retry(supabase.table("pagos").select("unidad_id, monto"))

    totals = defaultdict(lambda: {"expensas": Decimal("0"), "pagos": Decimal("0")})

    for item in expensas_res.data or []:
        totals[item["unidad_id"]]["expensas"] += to_decimal(item.get("monto"))

    for item in pagos_res.data or []:
        totals[item["unidad_id"]]["pagos"] += to_decimal(item.get("monto"))

    rows = []
    for unidad in unidades_res.data or []:
        deuda = totals[unidad["id"]]["expensas"] - totals[unidad["id"]]["pagos"]
        deuda = max(deuda, Decimal("0"))
        rows.append(
            {
                "unidad_id": unidad["id"],
                "unidad": f'{unidad.get("piso")}{unidad.get("apartamento")}',
                "propietario": unidad.get("nombre_responsable"),
                "deuda_total": money(deuda),
            }
        )

    return rows


@overview_bp.get("/resumen")
def resumen_overview():
    try:
        unidades_res = execute_with_retry(supabase.table("unidades").select("id", count="exact"))
        gastos_res = execute_with_retry(supabase.table("gastos_ordinarios").select("monto"))
        deudas = load_debt_by_unit()

        total_gastos = sum((to_decimal(item.get("monto")) for item in gastos_res.data or []), Decimal("0"))
        deuda_total = sum((Decimal(str(item["deuda_total"])) for item in deudas), Decimal("0"))

        return jsonify(
            {
                "total_unidades": unidades_res.count or 0,
                "total_gastos": money(total_gastos),
                "deuda_total": money(deuda_total),
            }
        ), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@overview_bp.get("/morosos")
def morosos_overview():
    try:
        rows = [row for row in load_debt_by_unit() if row["deuda_total"] > 0]
        rows.sort(key=lambda row: row["deuda_total"], reverse=True)
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
