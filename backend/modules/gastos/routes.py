from flask import Blueprint, jsonify, request

from database import supabase
from modules.common import first_day_for_period, money, parse_period, parse_positive_amount

gastos_bp = Blueprint("gastos", __name__)


@gastos_bp.get("/")
def listar_gastos():
    month_arg = request.args.get("mes")
    year_arg = request.args.get("year")

    try:
        query = (
            supabase.table("gastos_ordinarios")
            .select(
                "id, descripcion, monto, fecha_creacion, mes, year, "
                "se_repite_mensualmente, origen_gasto_id"
            )
            .order("year", desc=True)
            .order("mes", desc=True)
            .order("descripcion")
        )

        if month_arg is not None and year_arg is not None:
            month, year, error = parse_period(month_arg, year_arg)
            if error:
                return jsonify({"error": error}), 400
            query = query.eq("mes", month).eq("year", year)

        res = query.execute()
        gastos = res.data or []
        return jsonify([{**gasto, "monto": money(gasto.get("monto"))} for gasto in gastos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@gastos_bp.post("/")
def crear_gasto():
    data = request.get_json(silent=True) or {}
    descripcion = (data.get("descripcion") or "").strip()
    monto = parse_positive_amount(data.get("monto"))
    month, year, error = parse_period(data.get("mes"), data.get("year"))
    se_repite = bool(data.get("se_repite_mensualmente"))

    if not descripcion or monto is None or error:
        return jsonify({"error": error or "Descripcion, monto positivo, mes y year son requeridos"}), 400

    payload = {
        "descripcion": descripcion,
        "monto": str(monto),
        "fecha_creacion": data.get("fecha_creacion") or first_day_for_period(month, year),
        "mes": month,
        "year": year,
        "se_repite_mensualmente": se_repite,
    }

    try:
        res = supabase.table("gastos_ordinarios").insert(payload).execute()
        if not res.data:
            return jsonify({"error": "No se pudo crear el gasto"}), 400

        gasto = res.data[0]
        gasto["monto"] = money(gasto.get("monto"))
        return jsonify(gasto), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@gastos_bp.put("/<string:gasto_id>")
def actualizar_gasto(gasto_id):
    data = request.get_json(silent=True) or {}
    payload = {}

    if "descripcion" in data:
        descripcion = (data.get("descripcion") or "").strip()
        if not descripcion:
            return jsonify({"error": "Descripcion es requerida"}), 400
        payload["descripcion"] = descripcion

    if "monto" in data:
        monto = parse_positive_amount(data.get("monto"))
        if monto is None:
            return jsonify({"error": "Monto debe ser positivo"}), 400
        payload["monto"] = str(monto)

    if "mes" in data or "year" in data:
        month, year, error = parse_period(data.get("mes"), data.get("year"))
        if error:
            return jsonify({"error": error}), 400
        payload["mes"] = month
        payload["year"] = year
        payload["fecha_creacion"] = data.get("fecha_creacion") or first_day_for_period(month, year)

    if "se_repite_mensualmente" in data:
        payload["se_repite_mensualmente"] = bool(data.get("se_repite_mensualmente"))

    if not payload:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    try:
        res = supabase.table("gastos_ordinarios").update(payload).eq("id", gasto_id).execute()
        if not res.data:
            return jsonify({"error": "Gasto no encontrado"}), 404
        gasto = res.data[0]
        gasto["monto"] = money(gasto.get("monto"))
        return jsonify(gasto), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@gastos_bp.delete("/<string:gasto_id>")
def eliminar_gasto(gasto_id):
    try:
        res = supabase.table("gastos_ordinarios").delete().eq("id", gasto_id).execute()
        if not res.data:
            return jsonify({"error": "Gasto no encontrado"}), 404
        return jsonify({"message": "Gasto eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@gastos_bp.get("/<string:gasto_id>")
def obtener_gasto(gasto_id):
    try:
        res = supabase.table("gastos_ordinarios").select("*").eq("id", gasto_id).single().execute()
        gasto = res.data
        gasto["monto"] = money(gasto.get("monto"))
        return jsonify(gasto), 200
    except Exception as e:
        return jsonify({"error": "Gasto no encontrado", "detalle": str(e)}), 404
