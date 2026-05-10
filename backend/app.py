import os
import secrets
import string
import uuid

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client

from modules.expensas.routes import expensas_bp
from modules.gastos.routes import gastos_bp
from modules.inquilino.routes import inquilino_bp
from modules.overview.routes import overview_bp
from modules.pagos.routes import pagos_bp
from modules.unidades.routes import unidades_bp
from modules.reportes.routes import reportes_bp

load_dotenv()

app = Flask(__name__)


def get_cors_origins():
    origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


CORS(app, origins=get_cors_origins())
app.register_blueprint(gastos_bp, url_prefix="/api/gastos")
app.register_blueprint(unidades_bp, url_prefix="/api/unidades")
app.register_blueprint(expensas_bp, url_prefix="/api/expensas")
app.register_blueprint(pagos_bp, url_prefix="/api/pagos")
app.register_blueprint(overview_bp, url_prefix="/api/overview")
app.register_blueprint(inquilino_bp, url_prefix="/api/inquilino")
app.register_blueprint(reportes_bp, url_prefix="/api/reportes")


def get_supabase():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def request_credentials():
    body = request.get_json(silent=True) or {}
    username = (body.get("user") or "").strip()
    password = body.get("password") or ""

    if not username or not password:
        return None, None, (jsonify({"error": "Usuario y contrasena son requeridos"}), 400)

    return username, password, None


@app.get("/ping")
def ping():
    return jsonify({"message": "pong"})


VALID_ROLES = {"encargado", "inquilino"}
_CODE_CHARS = string.ascii_uppercase + string.digits


def _generate_access_code():
    return "".join(secrets.choice(_CODE_CHARS) for _ in range(6))


@app.post("/users/create")
def create_user():
    username, password, error = request_credentials()
    if error:
        return error

    body = request.get_json(silent=True) or {}
    rol = (body.get("rol") or "encargado").strip()

    if rol not in VALID_ROLES:
        return jsonify({"error": "Rol inválido. Use 'encargado' o 'inquilino'"}), 400

    supabase = get_supabase()
    existing = supabase.table("users").select("id").eq("username", username).execute()
    if existing.data:
        return jsonify({"error": "El usuario ya existe"}), 400

    user_id = str(uuid.uuid4())
    payload = {"id": user_id, "username": username, "password": password, "rol": rol}

    codigo_acceso = None
    if rol == "inquilino":
        codigo_acceso = _generate_access_code()
        payload["codigo_acceso"] = codigo_acceso

        nombre = (body.get("nombre") or "").strip() or None
        dni = (body.get("dni") or "").strip() or None
        email = (body.get("email") or "").strip() or None
        telefono = (body.get("telefono") or "").strip() or None
        if nombre:
            payload["nombre"] = nombre
        if dni:
            payload["dni"] = dni
        if email:
            payload["email"] = email
        if telefono:
            payload["telefono"] = telefono

    result = supabase.table("users").insert(payload).execute()
    if not result.data:
        return jsonify({"error": "No se pudo crear el usuario"}), 400

    response = {"id": user_id}
    if codigo_acceso:
        response["codigo_acceso"] = codigo_acceso
    return jsonify(response), 200


@app.post("/users/vincular")
def vincular_inquilino():
    """Encargado links a tenant to a unit using their access code."""
    body = request.get_json(silent=True) or {}
    codigo = (body.get("codigo_acceso") or "").strip().upper()
    unidad_id = (body.get("unidad_id") or "").strip()

    if not codigo or not unidad_id:
        return jsonify({"error": "codigo_acceso y unidad_id son requeridos"}), 400

    supabase = get_supabase()
    user_res = (
        supabase.table("users")
        .select("id, rol, unidad_id")
        .eq("codigo_acceso", codigo)
        .execute()
    )
    if not user_res.data:
        return jsonify({"error": "Código inválido. Verificá que el inquilino lo haya copiado correctamente"}), 404

    user = user_res.data[0]
    if user["rol"] != "inquilino":
        return jsonify({"error": "El código no corresponde a un inquilino"}), 400
    if user["unidad_id"]:
        return jsonify({"error": "Este inquilino ya está vinculado a una unidad"}), 400

    # Link user to unit
    update_res = (
        supabase.table("users")
        .update({"unidad_id": unidad_id, "codigo_acceso": None})
        .eq("id", user["id"])
        .execute()
    )
    if not update_res.data:
        return jsonify({"error": "No se pudo vincular al inquilino"}), 400

    # Copy inquilino's profile into the unidad contact fields (only non-empty values)
    profile_res = (
        supabase.table("users")
        .select("nombre, dni, email, telefono")
        .eq("id", user["id"])
        .execute()
    )
    if profile_res.data:
        profile = profile_res.data[0]
        unidad_update = {}
        if profile.get("nombre"):
            unidad_update["nombre_responsable"] = profile["nombre"]
        if profile.get("dni"):
            unidad_update["dni_responsable"] = profile["dni"]
        if profile.get("email"):
            unidad_update["mail_responsable"] = profile["email"]
        if profile.get("telefono"):
            unidad_update["tel_responsable"] = profile["telefono"]
        if unidad_update:
            supabase.table("unidades").update(unidad_update).eq("id", unidad_id).execute()

    return jsonify({"message": "Inquilino vinculado correctamente"}), 200


@app.post("/users/login")
def login_user():
    username, password, error = request_credentials()
    if error:
        return error

    result = (
        get_supabase()
        .table("users")
        .select("id, password, rol, unidad_id, codigo_acceso")
        .eq("username", username)
        .execute()
    )

    if not result.data or result.data[0]["password"] != password:
        return jsonify({"error": "Usuario o contrasena invalidos"}), 400

    user = result.data[0]
    return jsonify({
        "id": user["id"],
        "rol": user.get("rol", "encargado"),
        "unidad_id": user.get("unidad_id"),
        "codigo_acceso": user.get("codigo_acceso"),
    }), 200


@app.get("/user/<user_id>")
def get_user(user_id):
    result = (
        get_supabase()
        .table("users")
        .select("id, username, rol, unidad_id, codigo_acceso")
        .eq("id", user_id)
        .execute()
    )

    if not result.data:
        return jsonify({"error": "Usuario no encontrado"}), 400

    user = result.data[0]
    return jsonify({
        "id": user["id"],
        "user": user["username"],
        "rol": user.get("rol", "encargado"),
        "unidad_id": user.get("unidad_id"),
        "codigo_acceso": user.get("codigo_acceso"),
    }), 200


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=debug)
