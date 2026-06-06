from decimal import Decimal
from threading import Lock

from flask import Blueprint, jsonify, request

from database import supabase
from modules.common import (
    first_day_for_period,
    money,
    next_period,
    parse_period,
    period_less_than,
    to_decimal,
)

expensas_bp = Blueprint("expensas", __name__)
expensas_calculation_lock = Lock()


def materialize_recurring_gastos(target_month, target_year):
    roots_res = (
        supabase.table("gastos_ordinarios")
        .select("id, descripcion, monto, mes, year, se_repite_mensualmente, origen_gasto_id")
        .eq("se_repite_mensualmente", True)
        .is_("origen_gasto_id", "null")
        .execute()
    )

    for root in roots_res.data or []:
        root_month = int(root["mes"])
        root_year = int(root["year"])
        if not period_less_than(root_month, root_year, target_month, target_year):
            continue

        source = root
        current_month, current_year = next_period(root_month, root_year)
        while period_less_than(current_month, current_year, target_month, target_year) or (
            current_month == target_month and current_year == target_year
        ):
            existing_res = (
                supabase.table("gastos_ordinarios")
                .select("id, descripcion, monto")
                .eq("origen_gasto_id", root["id"])
                .eq("mes", current_month)
                .eq("year", current_year)
                .limit(1)
                .execute()
            )

            if existing_res.data:
                source = existing_res.data[0]
            else:
                clone_res = (
                    supabase.table("gastos_ordinarios")
                    .insert(
                        {
                            "descripcion": source["descripcion"],
                            "monto": source["monto"],
                            "fecha_creacion": first_day_for_period(current_month, current_year),
                            "mes": current_month,
                            "year": current_year,
                            "se_repite_mensualmente": True,
                            "origen_gasto_id": root["id"],
                        }
                    )
                    .execute()
                )
                source = clone_res.data[0]

            current_month, current_year = next_period(current_month, current_year)


def build_expensas_payload(month, year):
    gastos_res = (
        supabase.table("gastos_ordinarios")
        .select("monto")
        .eq("mes", month)
        .eq("year", year)
        .execute()
    )
    unidades_res = (
        supabase.table("unidades")
        .select("id, piso, apartamento, nombre_responsable, superficie")
        .order("piso")
        .order("apartamento")
        .execute()
    )

    try:
        gastos_part_res = (
            supabase.table("gastos_particulares")
            .select("unidad_id, monto")
            .eq("mes", month)
            .eq("year", year)
            .execute()
        )
        gastos_part_by_unit = {}
        for gp in gastos_part_res.data or []:
            uid = gp["unidad_id"]
            gastos_part_by_unit[uid] = gastos_part_by_unit.get(uid, Decimal("0")) + to_decimal(gp["monto"])
    except Exception:
        gastos_part_by_unit = {}

    gastos = gastos_res.data or []
    unidades = unidades_res.data or []
    if not unidades:
        return None, "No hay unidades para calcular expensas"

    superficies = []
    for unidad in unidades:
        superficie = to_decimal(unidad.get("superficie"))
        if superficie <= 0:
            unidad_label = f"{unidad.get('piso')} {unidad.get('apartamento')}"
            return None, f"La unidad {unidad_label} no tiene superficie positiva"
        superficies.append((unidad, superficie))

    total_gastos = sum((to_decimal(gasto.get("monto")) for gasto in gastos), Decimal("0"))
    total_superficie = sum((superficie for _, superficie in superficies), Decimal("0"))

    expensas = []
    for unidad, superficie in superficies:
        proporcion = superficie / total_superficie if total_superficie else Decimal("0")
        monto_comun = total_gastos * proporcion
        monto_particular = gastos_part_by_unit.get(unidad.get("id"), Decimal("0"))
        monto = monto_comun + monto_particular
        expensas.append(
            {
                "unidad_id": unidad.get("id"),
                "piso": unidad.get("piso"),
                "apartamento": unidad.get("apartamento"),
                "nombre_responsable": unidad.get("nombre_responsable"),
                "superficie": money(superficie),
                "porcentaje": float((proporcion * Decimal("100")).quantize(Decimal("0.0001"))),
                "monto": money(monto),
                "monto_particular": money(monto_particular),
                "mes": month,
                "year": year,
            }
        )

    return {
        "mes": month,
        "year": year,
        "total_gastos": money(total_gastos),
        "total_superficie": money(total_superficie),
        "expensas": expensas,
    }, None


@expensas_bp.route("/calcular", methods=["GET", "POST"])
def calcular_expensas():
    try:
        payload = request.get_json(silent=True) or {}
        month_arg = payload.get("mes") if request.method == "POST" else request.args.get("mes")
        year_arg = payload.get("year") if request.method == "POST" else request.args.get("year")
        month, year, error = parse_period(month_arg, year_arg)
        if error:
            return jsonify({"error": error}), 400

        with expensas_calculation_lock:
            materialize_recurring_gastos(month, year)
            data, build_error = build_expensas_payload(month, year)
            if build_error:
                return jsonify({"error": build_error}), 400

            rows = [
                {
                    "unidad_id": item["unidad_id"],
                    "mes": month,
                    "year": year,
                    "monto": str(item["monto"]),
                    "superficie": str(item["superficie"]),
                    "porcentaje": str(item["porcentaje"]),
                }
                for item in data["expensas"]
            ]
            if rows:
                supabase.table("expensas").upsert(
                    rows,
                    on_conflict="unidad_id,mes,year",
                ).execute()

        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@expensas_bp.get("/")
def listar_expensas():
    month, year, error = parse_period(request.args.get("mes"), request.args.get("year"))
    if error:
        return jsonify({"error": error}), 400

    try:
        data, build_error = build_expensas_payload(month, year)
        if build_error:
            return jsonify({"error": build_error}), 400
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
