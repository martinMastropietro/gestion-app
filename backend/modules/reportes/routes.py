import io
from datetime import datetime
from flask import Blueprint, jsonify, request, send_file
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from database import supabase
from decimal import Decimal
from modules.common import execute_with_retry, money, to_decimal

reportes_bp = Blueprint("reportes", __name__)


def format_date(date_str):
    """Convierte fecha ISO a formato dd/mm/yyyy"""
    if not date_str:
        return ""
    try:
        date_obj = datetime.fromisoformat(date_str)
        return date_obj.strftime("%d/%m/%Y")
    except:
        return date_str


def get_unidad_nombre(unidad_id):
    """Obtiene el nombre de la unidad por su ID"""
    try:
        res = supabase.table("unidades").select("piso, apartamento, nombre_responsable").eq("id", unidad_id).execute()
        if res.data:
            unidad = res.data[0]
            piso = unidad.get("piso") or ""
            apartamento = unidad.get("apartamento") or ""
            propietario = unidad.get("nombre_responsable") or "N/A"
            return f"{piso}{apartamento} - {propietario}"
        return "N/A"
    except:
        return "N/A"


@reportes_bp.post("/generar")
def generar_reporte():
    """Genera un reporte en PDF según el tipo solicitado"""
    data = request.get_json(silent=True) or {}
    tipo_reporte = (data.get("tipo") or "").strip()
    filtros = data.get("filtros", {})

    if tipo_reporte not in {"reporte_pagos", "reporte_morosos", "reporte_gastos"}:
        return jsonify({"error": "Tipo de reporte no válido"}), 400

    # Definir filtros válidos por tipo de reporte
    filtros_validos = {
        "reporte_morosos": {
            "ordenar_por": ["deuda_total"],
            "orden": ["asc", "desc"]
        },
        "reporte_pagos": {
            "ordenar_por": ["fecha_pago", "monto"],
            "orden": ["asc", "desc"]
        },
        "reporte_gastos": {
            "ordenar_por": ["monto", "periodo"],
            "orden": ["asc", "desc"]
        }
    }

    # Validar filtros
    for key, value in filtros.items():
        if key not in filtros_validos[tipo_reporte]:
            return jsonify({"error": f"Filtro '{key}' no válido para {tipo_reporte}"}), 400
        if value not in filtros_validos[tipo_reporte][key]:
            return jsonify({"error": f"Valor '{value}' no válido para filtro '{key}'"}), 400

    try:
        morosos = []
        pagos = []
        gastos = []

        if tipo_reporte == "reporte_morosos":
            unidades_res = execute_with_retry(
                supabase.table("unidades")
                .select("id, piso, apartamento, nombre_responsable")
                .order("piso")
                .order("apartamento")
            )
            expensas_res = execute_with_retry(supabase.table("expensas").select("unidad_id, monto"))
            pagos_res = execute_with_retry(supabase.table("pagos").select("unidad_id, monto"))

            totals = {}
            for item in expensas_res.data or []:
                uid = item.get("unidad_id")
                if uid is None:
                    continue
                totals.setdefault(uid, {"expensas": Decimal("0"), "pagos": Decimal("0")})
                totals[uid]["expensas"] += to_decimal(item.get("monto"))

            for item in pagos_res.data or []:
                uid = item.get("unidad_id")
                if uid is None:
                    continue
                totals.setdefault(uid, {"expensas": Decimal("0"), "pagos": Decimal("0")})
                totals[uid]["pagos"] += to_decimal(item.get("monto"))

            morosos = []
            for unidad in unidades_res.data or []:
                uid = unidad.get("id")
                deuda = totals.get(uid, {"expensas": Decimal("0"), "pagos": Decimal("0")})
                deuda_total = deuda["expensas"] - deuda["pagos"]
                if deuda_total <= Decimal("0"):
                    continue

                morosos.append(
                    {
                        "unidad": f'{unidad.get("piso")}{unidad.get("apartamento")}',
                        "propietario": unidad.get("nombre_responsable"),
                        "deuda_total": money(deuda_total),
                    }
                )

            # Aplicar filtros para morosos
            if filtros.get("ordenar_por") == "deuda_total":
                reverse = filtros.get("orden") == "desc"
                morosos.sort(key=lambda item: item["deuda_total"], reverse=reverse)
            # Si no, mantener el orden de unidades (por piso/apartamento)

        elif tipo_reporte == "reporte_pagos":
            # Obtener todos los pagos
            pagos_res = (
                supabase.table("pagos")
                .select("id, unidad_id, fecha_pago, mes, year, monto, observacion")
                .execute()
            )
            pagos = pagos_res.data or []

            # Aplicar filtros para pagos
            if filtros.get("ordenar_por") == "fecha_pago":
                reverse = filtros.get("orden") == "desc"
                pagos.sort(key=lambda item: item["fecha_pago"] or "", reverse=reverse)
            elif filtros.get("ordenar_por") == "monto":
                reverse = filtros.get("orden") == "desc"
                pagos.sort(key=lambda item: float(item.get("monto", 0)), reverse=reverse)

        elif tipo_reporte == "reporte_gastos":
            # Obtener todos los gastos
            gastos_res = (
                supabase.table("gastos_ordinarios")
                .select("id, descripcion, monto, mes, year, se_repite_mensualmente")
                .execute()
            )
            gastos = gastos_res.data or []

            # Aplicar filtros para gastos
            if filtros.get("ordenar_por") == "monto":
                reverse = filtros.get("orden") == "desc"
                gastos.sort(key=lambda item: float(item.get("monto", 0)), reverse=reverse)
            elif filtros.get("ordenar_por") == "periodo":
                reverse = filtros.get("orden") == "desc"
                gastos.sort(key=lambda item: (item.get("year", 0), item.get("mes", 0)), reverse=reverse)

        # Generar PDF
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=18,
            textColor=colors.Color(15/255, 31/255, 61/255),
            spaceAfter=6,
            fontName="Helvetica-Bold",
        )
        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=11,
            textColor=colors.Color(37/255, 99/255, 235/255),
            spaceBefore=12,
            spaceAfter=6,
        )
        table_text_style = ParagraphStyle(
            "TableText",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            spaceAfter=0,
            spaceBefore=0,
        )

        # Contenido
        elements = []

        title_text = "REPORTE DE MOROSOS" if tipo_reporte == "reporte_morosos" else "REPORTE DE PAGOS" if tipo_reporte == "reporte_pagos" else "REPORTE DE GASTOS"
        elements.append(Paragraph(title_text, title_style))
        elements.append(Spacer(1, 0.2 * inch))

        # Fecha de generación
        fecha_reporte = datetime.now().strftime("%d/%m/%Y %H:%M")
        elements.append(
            Paragraph(f"<b>Fecha de generación:</b> {fecha_reporte}", styles["Normal"])
        )
        elements.append(Spacer(1, 0.15 * inch))

        if tipo_reporte == "reporte_morosos":
            if not morosos:
                elements.append(Paragraph("No hay unidades morosas actualmente.", styles["Normal"]))
            else:
                tabla_data = [
                    ["Unidad", "Propietario", "Deuda Total"],
                ]
                for moroso in morosos:
                    tabla_data.append([
                        Paragraph(moroso["unidad"], table_text_style),
                        Paragraph(moroso["propietario"] or "-", table_text_style),
                        money(moroso["deuda_total"]),
                    ])

                table = Table(tabla_data, colWidths=[1.2 * inch, 2.0 * inch, 1.1 * inch])
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(30/255, 64/255, 175/255)),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 9),
                            ("FONTSIZE", (0, 1), (-1, -1), 8),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                            ("GRID", (0, 0), (-1, -1), 0.5, colors.Color(37/255, 99/255, 235/255)),
                            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(244/255, 246/255, 249/255)]),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ]
                    )
                )
                elements.append(table)
                elements.append(Spacer(1, 0.2 * inch))
                total_morosos = len(morosos)
                deuda_total = sum(moroso["deuda_total"] for moroso in morosos)
                elements.append(
                    Paragraph(f"<b>Total de morosos:</b> {total_morosos}", styles["Normal"])
                )
                elements.append(
                    Paragraph(f"<b>Deuda total:</b> {money(deuda_total)}", styles["Normal"])
                )

        elif tipo_reporte == "reporte_pagos":
            if not pagos:
                elements.append(Paragraph("No hay pagos registrados.", styles["Normal"]))
            else:
                # Tabla de pagos
                tabla_data = [
                    [
                        "Unidad",
                        "Fecha Pago",
                        "Período",
                        "Monto",
                        "Observación",
                    ]
                ]

                for pago in pagos:
                    unidad_nombre = get_unidad_nombre(pago.get("unidad_id"))
                    fecha = format_date(pago.get("fecha_pago"))
                    periodo = f"{pago.get('mes')}/{pago.get('year')}"
                    monto = money(pago.get("monto"))
                    observacion_text = pago.get("observacion") or "-"
                    observacion = observacion_text[:120] + "..." if len(observacion_text) > 120 else observacion_text

                    tabla_data.append(
                        [
                            Paragraph(unidad_nombre, table_text_style),
                            fecha,
                            periodo,
                            monto,
                            Paragraph(observacion, table_text_style),
                        ]
                    )

                # Crear tabla
                table = Table(tabla_data, colWidths=[1.8 * inch, 1 * inch, 0.8 * inch, 0.9 * inch, 1.0 * inch])
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(30/255, 64/255, 175/255)),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("ALIGN", (2, 0), (2, -1), "CENTER"),
                            ("ALIGN", (3, 0), (3, -1), "RIGHT"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 9),
                            ("FONTSIZE", (0, 1), (-1, -1), 8),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                            ("GRID", (0, 0), (-1, -1), 0.5, colors.Color(37/255, 99/255, 235/255)),
                            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(244/255, 246/255, 249/255)]),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ]
                    )
                )

                elements.append(table)

                # Totales
                elements.append(Spacer(1, 0.2 * inch))
                total_pagos = len(pagos)
                monto_total = sum(float(pago.get("monto", 0)) for pago in pagos)
                monto_total_formateado = money(monto_total)

                elements.append(
                    Paragraph(
                        f"<b>Total de pagos:</b> {total_pagos}",
                        styles["Normal"],
                    )
                )
                elements.append(
                    Paragraph(
                        f"<b>Monto total:</b> {monto_total_formateado}",
                        styles["Normal"],
                    )
                )

        elif tipo_reporte == "reporte_gastos":
            if not gastos:
                elements.append(Paragraph("No hay gastos registrados.", styles["Normal"]))
            else:
                # Tabla de gastos
                tabla_data = [
                    [
                        "Descripción",
                        "Monto",
                        "Período",
                        "Repite",
                    ]
                ]

                for gasto in gastos:
                    descripcion = gasto.get("descripcion") or "-"
                    monto = money(gasto.get("monto"))
                    periodo = f"{gasto.get('mes')}/{gasto.get('year')}"
                    repite = "Sí" if gasto.get("se_repite_mensualmente") else "No"

                    tabla_data.append(
                        [
                            Paragraph(descripcion, table_text_style),
                            monto,
                            periodo,
                            repite,
                        ]
                    )

                # Crear tabla
                table = Table(tabla_data, colWidths=[2.5 * inch, 1.0 * inch, 0.8 * inch, 0.7 * inch])
                table.setStyle(
                    TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(30/255, 64/255, 175/255)),
                            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                            ("ALIGN", (2, 0), (2, -1), "CENTER"),
                            ("ALIGN", (3, 0), (3, -1), "CENTER"),
                            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                            ("FONTSIZE", (0, 0), (-1, 0), 9),
                            ("FONTSIZE", (0, 1), (-1, -1), 8),
                            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                            ("GRID", (0, 0), (-1, -1), 0.5, colors.Color(37/255, 99/255, 235/255)),
                            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(244/255, 246/255, 249/255)]),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ]
                    )
                )

                elements.append(table)

                # Totales
                elements.append(Spacer(1, 0.2 * inch))
                total_gastos = len(gastos)
                monto_total = sum(float(gasto.get("monto", 0)) for gasto in gastos)
                monto_total_formateado = money(monto_total)

                elements.append(
                    Paragraph(
                        f"<b>Total de gastos:</b> {total_gastos}",
                        styles["Normal"],
                    )
                )
                elements.append(
                    Paragraph(
                        f"<b>Monto total:</b> {monto_total_formateado}",
                        styles["Normal"],
                    )
                )

        # Construir PDF
        doc.build(elements)
        pdf_buffer.seek(0)

        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"{tipo_reporte}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
