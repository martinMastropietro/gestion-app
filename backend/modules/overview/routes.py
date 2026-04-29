from collections import defaultdict
from datetime import date
from decimal import Decimal

from flask import Blueprint, jsonify

from database import supabase
from modules.common import execute_with_retry, last_day_for_period, money, to_decimal

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


def _urgency_time_factor(dias_atraso):
    """Return a multiplier based on how overdue a debt is.

    Overdue debts get a factor >= 2.0 that grows with each additional month.
    Not-yet-due debts get a factor < 1.0 that shrinks the further away the
    due date is. This guarantees that any overdue debt beats a same-amount
    not-yet-due debt, while still letting a much larger not-yet-due debt
    beat a tiny overdue one.
    """
    if dias_atraso > 0:
        return 2.0 + dias_atraso / 30.0
    return 1.0 / (1.0 + (-dias_atraso) / 30.0)


@overview_bp.get("/morosos_urgencia")
def morosos_urgencia():
    """Return all units with debt, sorted by urgency score.

    Urgency score = deuda_total × time_factor(dias_atraso).
    Oldest unpaid period is found via FIFO allocation: payments are applied
    oldest-period-first until they run out; the first period still owing
    money after that becomes the reference date.
    """
    try:
        unidades_res = execute_with_retry(
            supabase.table("unidades")
            .select("id, piso, apartamento, nombre_responsable")
            .order("piso")
            .order("apartamento")
        )
        expensas_res = execute_with_retry(
            supabase.table("expensas").select("unidad_id, mes, year, monto")
        )
        pagos_res = execute_with_retry(
            supabase.table("pagos")
            .select("unidad_id, monto, fecha_pago")
            .order("fecha_pago")
        )

        # Index expensas per unit, sorted by period (oldest first)
        expensas_by_unit = defaultdict(list)
        for item in expensas_res.data or []:
            expensas_by_unit[item["unidad_id"]].append(item)

        for uid in expensas_by_unit:
            expensas_by_unit[uid].sort(key=lambda e: (e["year"], e["mes"]))

        # Aggregate total payments and last payment date per unit
        total_pagos = defaultdict(lambda: Decimal("0"))
        ultimo_pago = {}
        for item in pagos_res.data or []:
            uid = item["unidad_id"]
            total_pagos[uid] += to_decimal(item.get("monto"))
            ultimo_pago[uid] = item.get("fecha_pago")  # already ordered asc

        today = date.today()
        rows = []
        for unidad in unidades_res.data or []:
            uid = unidad["id"]
            unit_expensas = expensas_by_unit.get(uid, [])

            # FIFO allocation: walk periods oldest-first, consume payments
            remaining_pagos = total_pagos[uid]
            oldest_unpaid = None
            total_expensas = Decimal("0")

            for exp in unit_expensas:
                monto = to_decimal(exp.get("monto"))
                total_expensas += monto

                if oldest_unpaid is None:
                    if remaining_pagos >= monto:
                        remaining_pagos -= monto
                    else:
                        oldest_unpaid = (exp["mes"], exp["year"])
                        remaining_pagos = Decimal("0")

            deuda = max(total_expensas - total_pagos[uid], Decimal("0"))
            if deuda == 0:
                continue

            dias_atraso = None
            if oldest_unpaid:
                due_date = last_day_for_period(oldest_unpaid[0], oldest_unpaid[1])
                dias_atraso = (today - due_date).days

            time_factor = _urgency_time_factor(dias_atraso) if dias_atraso is not None else 0.5
            urgency_score = float(deuda) * time_factor

            rows.append({
                "unidad_id": uid,
                "unidad": f'{unidad.get("piso")}{unidad.get("apartamento")}',
                "propietario": unidad.get("nombre_responsable"),
                "deuda_total": money(deuda),
                "periodo_mas_antiguo": {
                    "mes": oldest_unpaid[0] if oldest_unpaid else None,
                    "year": oldest_unpaid[1] if oldest_unpaid else None,
                },
                "dias_atraso": dias_atraso,
                "ultimo_pago": ultimo_pago.get(uid),
                "urgency_score": round(urgency_score, 2),
            })

        rows.sort(key=lambda r: r["urgency_score"], reverse=True)
        return jsonify(rows), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
