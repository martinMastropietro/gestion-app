import os
import uuid

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client

from modules.gastos.routes import gastos_bp

load_dotenv()

app = Flask(__name__)


def get_cors_origins():
    origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


CORS(app, origins=get_cors_origins())
app.register_blueprint(gastos_bp, url_prefix="/api/gastos")


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


@app.post("/users/create")
def create_user():
    username, password, error = request_credentials()
    if error:
        return error

    supabase = get_supabase()
    existing = supabase.table("users").select("id").eq("username", username).execute()

    if existing.data:
        return jsonify({"error": "El usuario ya existe"}), 400

    user_id = str(uuid.uuid4())
    result = (
        supabase.table("users")
        .insert({"id": user_id, "username": username, "password": password})
        .execute()
    )

    if not result.data:
        return jsonify({"error": "No se pudo crear el usuario"}), 400

    return jsonify({"id": user_id}), 200


@app.post("/users/login")
def login_user():
    username, password, error = request_credentials()
    if error:
        return error

    result = (
        get_supabase()
        .table("users")
        .select("id,password")
        .eq("username", username)
        .execute()
    )

    if not result.data or result.data[0]["password"] != password:
        return jsonify({"error": "Usuario o contrasena invalidos"}), 400

    return jsonify({"id": result.data[0]["id"]}), 200


@app.get("/user/<user_id>")
def get_user(user_id):
    result = (
        get_supabase()
        .table("users")
        .select("id,username")
        .eq("id", user_id)
        .execute()
    )

    if not result.data:
        return jsonify({"error": "Usuario no encontrado"}), 400

    user = result.data[0]
    return jsonify({"id": user["id"], "user": user["username"]}), 200


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=debug)
