from flask import Blueprint, request, jsonify
from database import supabase

gastos_bp = Blueprint('gastos', __name__)

@gastos_bp.route('/', methods=['POST'])
def registrar_gasto():
    data = request.json
    print(f"DEBUG - Datos recibidos: {data}")
    
    if data is None:
        return jsonify({"status": "error", "message": "No se recibió un JSON válido"}), 400

  
    nuevo_gasto = {
        "descripcion": data.get('descripcion'),
        "monto": data.get('monto'),
        "fecha_gasto": data.get('fecha_gasto'), 
        "categoria": data.get('categoria'),
        "estado": data.get('estado', 'Pendiente'),
        "metodo_pago": data.get('metodo_pago'),
        "comprobante": data.get('comprobante'), 
        "unidad_id": data.get('unidad_id') 
    }

    try:
        # Validación de campos obligatorios
        if not nuevo_gasto["descripcion"] or not nuevo_gasto["monto"]:
            return jsonify({"status": "error", "message": "Descripción y monto son obligatorios"}), 400

     
        res = supabase.table("gastos").insert(nuevo_gasto).execute()
        return jsonify({"status": "success", "data": res.data}), 201
    except Exception as e:
        print(f"ERROR DETALLADO: {e}") 
        return jsonify({"status": "error", "message": str(e)}), 400

@gastos_bp.route('/unidades-selector', methods=['GET'])
def obtener_unidades():
    """Ruta para que el frontend cargue el selector de unidades"""
    try:
        res = supabase.table("unidades").select("id, piso, departamento").execute()
        return jsonify(res.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500