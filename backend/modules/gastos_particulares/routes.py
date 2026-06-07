from flask import Blueprint, jsonify, request

from database import supabase
from modules.common import first_day_for_period, money, parse_period, parse_positive_amount

gastos_particulares_bp = Blueprint("gastos_particulares", __name__)


@gastos_particulares_bp.get("/")
def listar_gastos_particulares():
    month_arg = request.args.get("mes")
    year_arg = request.args.get("year")
    unidad_id = request.args.get("unidad_id")

    try:
        query = (
            supabase.table("gastos_particulares")
            .select(
                "id, unidad_id, descripcion, monto, fecha_creacion, mes, year, "
                "unidades(piso, apartamento)"
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

        if unidad_id:
            query = query.eq("unidad_id", unidad_id)

        res = query.execute()
        gastos = res.data or []
        return jsonify([{**g, "monto": money(g.get("monto"))} for g in gastos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@gastos_particulares_bp.post("/")
def crear_gasto_particular():
    data = request.get_json(silent=True) or {}
    descripcion = (data.get("descripcion") or "").strip()
    monto = parse_positive_amount(data.get("monto"))
    unidad_id = (data.get("unidad_id") or "").strip()
    month, year, error = parse_period(data.get("mes"), data.get("year"))

    if not descripcion or monto is None or not unidad_id or error:
        return jsonify({"error": error or "Descripcion, monto positivo, unidad, mes y year son requeridos"}), 400

    payload = {
        "descripcion": descripcion,
        "monto": str(monto),
        "unidad_id": unidad_id,
        "fecha_creacion": data.get("fecha_creacion") or first_day_for_period(month, year),
        "mes": month,
        "year": year,
    }

    try:
        res = supabase.table("gastos_particulares").insert(payload).execute()
        if not res.data:
            return jsonify({"error": "No se pudo crear el gasto particular"}), 400
        gasto = res.data[0]
        gasto["monto"] = money(gasto.get("monto"))
        return jsonify(gasto), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@gastos_particulares_bp.put("/<string:gasto_id>")
def actualizar_gasto_particular(gasto_id):
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

    if "unidad_id" in data:
        unidad_id = (data.get("unidad_id") or "").strip()
        if not unidad_id:
            return jsonify({"error": "unidad_id es requerido"}), 400
        payload["unidad_id"] = unidad_id

    if "mes" in data or "year" in data:
        month, year, error = parse_period(data.get("mes"), data.get("year"))
        if error:
            return jsonify({"error": error}), 400
        payload["mes"] = month
        payload["year"] = year
        payload["fecha_creacion"] = data.get("fecha_creacion") or first_day_for_period(month, year)

    if not payload:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    try:
        res = supabase.table("gastos_particulares").update(payload).eq("id", gasto_id).execute()
        if not res.data:
            return jsonify({"error": "Gasto particular no encontrado"}), 404
        gasto = res.data[0]
        gasto["monto"] = money(gasto.get("monto"))
        return jsonify(gasto), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@gastos_particulares_bp.delete("/<string:gasto_id>")
def eliminar_gasto_particular(gasto_id):
    try:
        res = supabase.table("gastos_particulares").delete().eq("id", gasto_id).execute()
        if not res.data:
            return jsonify({"error": "Gasto particular no encontrado"}), 404
        return jsonify({"message": "Gasto particular eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
