from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request

from database import supabase

unidades_bp = Blueprint("unidades", __name__)

REQUIRED_FIELDS = ("piso", "apartamento", "superficie")

CONTACT_FIELDS = (
    "nombre_responsable",
    "dni_responsable",
    "mail_responsable",
    "tel_responsable",
)


def parse_piso(value):
    try:
        piso = int(value)
    except (TypeError, ValueError):
        return None
    if piso < 0:
        return None
    return piso


def parse_superficie(value):
    try:
        superficie = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None
    if superficie <= 0:
        return None
    return str(superficie)


def build_payload(data, partial=False):
    if not partial:
        missing = [f for f in REQUIRED_FIELDS if data.get(f) in (None, "")]
        if missing:
            return None, f"Campos requeridos: {', '.join(missing)}"

    payload = {}

    if "piso" in data:
        piso = parse_piso(data.get("piso"))
        if piso is None:
            return None, "Piso debe ser un entero no negativo"
        payload["piso"] = piso

    if "apartamento" in data:
        value = (data.get("apartamento") or "").strip()
        if not value:
            return None, "apartamento es requerido"
        payload["apartamento"] = value

    # Contact fields are optional: filled by the inquilino link or manually by encargado
    for field in CONTACT_FIELDS:
        if field in data:
            value = (data.get(field) or "").strip() or None
            payload[field] = value

    if "superficie" in data:
        superficie = parse_superficie(data.get("superficie"))
        if superficie is None:
            return None, "Superficie debe ser mayor a cero"
        payload["superficie"] = superficie

    return payload, None


def _apply_codigo_acceso(codigo, unidad_id):
    """Link an inquilino to a unit by access code and copy their profile.

    Returns (success: bool, error_message: str | None).
    """
    codigo = (codigo or "").strip().upper()
    if not codigo:
        return True, None  # no code provided, nothing to do

    user_res = (
        supabase.table("users")
        .select("id, rol, unidad_id, nombre, dni, email, telefono")
        .eq("codigo_acceso", codigo)
        .execute()
    )
    if not user_res.data:
        return False, "Código inválido. Verificá que el inquilino lo haya copiado correctamente"

    user = user_res.data[0]
    if user["rol"] != "inquilino":
        return False, "El código no corresponde a un inquilino"
    if user["unidad_id"] and user["unidad_id"] != unidad_id:
        return False, "Este inquilino ya está vinculado a otra unidad"

    supabase.table("users").update({"unidad_id": unidad_id, "codigo_acceso": None}).eq("id", user["id"]).execute()

    # Copy inquilino profile to unidad contact fields
    unidad_update = {}
    if user.get("nombre"):
        unidad_update["nombre_responsable"] = user["nombre"]
    if user.get("dni"):
        unidad_update["dni_responsable"] = user["dni"]
    if user.get("email"):
        unidad_update["mail_responsable"] = user["email"]
    if user.get("telefono"):
        unidad_update["tel_responsable"] = user["telefono"]
    if unidad_update:
        supabase.table("unidades").update(unidad_update).eq("id", unidad_id).execute()

    return True, None


@unidades_bp.get("/")
def listar_unidades():
    try:
        res = (
            supabase.table("unidades")
            .select(
                "id, piso, apartamento, nombre_responsable, dni_responsable, "
                "mail_responsable, tel_responsable, superficie"
            )
            .order("piso")
            .order("apartamento")
            .execute()
        )
        unidades = res.data or []

        # Collect which unidad_ids already have a linked inquilino
        linked_res = (
            supabase.table("users")
            .select("unidad_id")
            .eq("rol", "inquilino")
            .not_.is_("unidad_id", "null")
            .execute()
        )
        linked_ids = {row["unidad_id"] for row in (linked_res.data or [])}

        for u in unidades:
            u["tiene_inquilino"] = u["id"] in linked_ids

        return jsonify(unidades), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@unidades_bp.post("/")
def crear_unidad():
    data = request.get_json(silent=True) or {}
    payload, error = build_payload(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        res = supabase.table("unidades").insert(payload).execute()
        if not res.data:
            return jsonify({"error": "No se pudo crear la unidad"}), 400

        unidad = res.data[0]
        codigo_acceso = (data.get("codigo_acceso") or "").strip()
        if codigo_acceso:
            ok, err = _apply_codigo_acceso(codigo_acceso, unidad["id"])
            if not ok:
                return jsonify({"error": err}), 400
            # Re-fetch to return updated contact fields
            updated = supabase.table("unidades").select("*").eq("id", unidad["id"]).execute()
            unidad = updated.data[0] if updated.data else unidad

        return jsonify(unidad), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@unidades_bp.put("/<string:unidad_id>")
def actualizar_unidad(unidad_id):
    data = request.get_json(silent=True) or {}
    payload, error = build_payload(data, partial=True)
    if error:
        return jsonify({"error": error}), 400

    codigo_acceso = (data.get("codigo_acceso") or "").strip()

    if not payload and not codigo_acceso:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    try:
        if payload:
            res = supabase.table("unidades").update(payload).eq("id", unidad_id).execute()
            if not res.data:
                return jsonify({"error": "Unidad no encontrada"}), 404

        if codigo_acceso:
            ok, err = _apply_codigo_acceso(codigo_acceso, unidad_id)
            if not ok:
                return jsonify({"error": err}), 400

        updated = supabase.table("unidades").select("*").eq("id", unidad_id).execute()
        return jsonify(updated.data[0] if updated.data else {}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@unidades_bp.delete("/<string:unidad_id>")
def eliminar_unidad(unidad_id):
    try:
        res = supabase.table("unidades").delete().eq("id", unidad_id).execute()
        if not res.data:
            return jsonify({"error": "Unidad no encontrada"}), 404
        return jsonify({"message": "Unidad eliminada exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
