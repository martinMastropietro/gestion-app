from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request

from database import supabase

gastos_bp = Blueprint("gastos", __name__)


def parse_positive_amount(value):
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None

    if amount <= 0:
        return None

    return str(amount)


@gastos_bp.get("/")
def listar_gastos():
    try:
        res = (
            supabase.table("gastos_ordinarios")
            .select("id, descripcion, monto")
            .order("descripcion")
            .execute()
        )
        return jsonify(res.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@gastos_bp.post("/")
def crear_gasto():
    data = request.get_json(silent=True) or {}
    descripcion = (data.get("descripcion") or "").strip()
    monto = parse_positive_amount(data.get("monto"))

    if not descripcion or monto is None:
        return jsonify({"error": "Descripcion y monto positivo son requeridos"}), 400

    try:
        res = (
            supabase.table("gastos_ordinarios")
            .insert({"descripcion": descripcion, "monto": monto})
            .execute()
        )
        return jsonify(res.data[0] if res.data else None), 201
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
        payload["monto"] = monto

    if not payload:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    try:
        res = (
            supabase.table("gastos_ordinarios")
            .update(payload)
            .eq("id", gasto_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Gasto no encontrado"}), 404
        return jsonify(res.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@gastos_bp.delete("/<string:gasto_id>")
def eliminar_gasto(gasto_id):
    try:
        res = (
            supabase.table("gastos_ordinarios")
            .delete()
            .eq("id", gasto_id)
            .execute()
        )
        if not res.data:
            return jsonify({"error": "Gasto no encontrado"}), 404
        return jsonify({"message": "Gasto eliminado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@gastos_bp.route('/<string:id>', methods=['GET'])
def obtener_gasto(id):
    """Trae la información de un gasto específico por su ID"""
    try:
        # Usamos gastos_ordinarios y quitamos la relación de unidades por ahora para evitar errores
        res = supabase.table("gastos_ordinarios").select("*").eq("id", id).single().execute()
        
        return jsonify(res.data), 200
    except Exception as e:
        return jsonify({"error": "Gasto no encontrado", "detalle": str(e)}), 404