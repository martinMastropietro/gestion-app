"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

const TIPOS_REPORTES = [
  { id: "reporte_pagos", label: "Reporte de Pagos", descripcion: "Lista de todos los pagos realizados" },
  { id: "reporte_morosos", label: "Reporte de Morosos", descripcion: "Lista de todas las unidades actualmente morosas" },
  { id: "reporte_gastos", label: "Reporte de Gastos", descripcion: "Lista de todos los gastos registrados" },
];

export default function ReportesPage() {
  const router = useRouter();
  const [reporteSeleccionado, setReporteSeleccionado] = useState("");
  const [filtros, setFiltros] = useState({ ordenar_por: "", orden: "asc" });
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userId = window.localStorage.getItem("userId");
    const userRole = window.localStorage.getItem("userRole");

    if (!userId) {
      router.push("/login");
      return;
    }

    if (userRole === "inquilino") {
      router.push("/inquilino");
      return;
    }

    setIsLoading(false);
  }, [router]);

  function handleReporteChange(reporteId) {
    setReporteSeleccionado(reporteId);
    setFiltros({ ordenar_por: "", orden: "asc" }); // Resetear filtros al cambiar reporte
    setError("");
  }

  async function handleGenerarReporte() {
    if (!reporteSeleccionado) {
      setError("Debe seleccionar un tipo de reporte");
      return;
    }

    setError("");
    setSuccess(false);
    setIsGenerating(true);

    try {
      const tipoReporte = reporteSeleccionado;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/reportes/generar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: tipoReporte,
          filtros: filtros,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al generar el reporte");
      }

      // El backend retorna un PDF directamente
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return null;
  }

  return (
    <DashboardLayout>
      <style>{`
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 6px 0 0; font-size: 32px; font-weight: 600; color: var(--text-main); }
        
        .card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .card.form { display: grid; gap: 20px; }
        
        .label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        
        .checkbox-group { display: grid; gap: 12px; }
        .checkbox-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px; border: 1px solid var(--border-light); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .checkbox-item:hover { background: rgba(37,99,235,.04); border-color: var(--primary); }
        .checkbox-item input { margin-top: 4px; cursor: pointer; }
        .checkbox-label { display: flex; flex-direction: column; gap: 2px; }
        .checkbox-label .name { font-weight: 600; color: var(--text-main); font-size: 15px; }
        .checkbox-label .desc { font-size: 13px; color: #64748b; }
        
        .select { padding: 10px 12px; border: 1px solid var(--border-light); border-radius: 8px; outline: none; background: #fff; font-size: 14px; }
        
        .btn { padding: 12px 24px; border-radius: 12px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }
        .btn.primary { background: var(--primary); color: #fff; }
        .btn.primary:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
        .btn.primary:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
        .btn.success { background: #16a34a; color: #fff; }
        .btn.success:hover { background: #15803d; }
        
        .error { color: #ef4444; background: #fef2f2; border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px 14px; border-radius: 8px; margin-bottom: 12px; }
        .success-box { background: #f0fdf4; border: 1px solid rgba(34,197,94,.3); border-radius: 12px; padding: 20px; display: grid; gap: 16px; justify-items: start; }
        .success-message { color: #15803d; font-weight: 600; font-size: 16px; }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Análisis</div>
          <h1 className="title">Reportes</h1>
        </div>
      </div>

      <div style={{ maxWidth: "800px" }}>
        <div className="card form">
          {error && <div className="error">{error}</div>}

          {success && (
            <div className="success-box">
              <div className="success-message">✓ Reporte generado y descargado exitosamente</div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setReporteSeleccionado("");
                }}
                className="btn success"
              >
                Generar Otro Reporte
              </button>
            </div>
          )}

          {!success && (
            <>
              <div>
                <label className="label" style={{ marginBottom: "12px", display: "block" }}>
                  Selecciona el tipo de reporte
                </label>
                <div className="checkbox-group">
                  {TIPOS_REPORTES.map((reporte) => (
                    <label key={reporte.id} className="checkbox-item">
                      <input
                        type="radio"
                        name="tipoReporte"
                        checked={reporteSeleccionado === reporte.id}
                        onChange={() => handleReporteChange(reporte.id)}
                      />
                      <div className="checkbox-label">
                        <span className="name">{reporte.label}</span>
                        <span className="desc">{reporte.descripcion}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {reporteSeleccionado === "reporte_morosos" && (
                <div style={{ display: "grid", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 }}>
                    Ordenar por:
                    <select
                      value={filtros.ordenar_por}
                      onChange={(e) => setFiltros({ ...filtros, ordenar_por: e.target.value })}
                      className="select"
                    >
                      <option value="">Sin ordenar</option>
                      <option value="deuda_total">Deuda Total</option>
                    </select>
                  </label>
                  {filtros.ordenar_por && (
                    <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 }}>
                      Orden:
                      <select
                        value={filtros.orden}
                        onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
                        className="select"
                      >
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                      </select>
                    </label>
                  )}
                </div>
              )}

              {reporteSeleccionado === "reporte_pagos" && (
                <div style={{ display: "grid", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 }}>
                    Ordenar por:
                    <select
                      value={filtros.ordenar_por}
                      onChange={(e) => setFiltros({ ...filtros, ordenar_por: e.target.value })}
                      className="select"
                    >
                      <option value="">Sin ordenar</option>
                      <option value="fecha_pago">Fecha de Pago</option>
                      <option value="monto">Monto</option>
                    </select>
                  </label>
                  {filtros.ordenar_por && (
                    <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 }}>
                      Orden:
                      <select
                        value={filtros.orden}
                        onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
                        className="select"
                      >
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                      </select>
                    </label>
                  )}
                </div>
              )}

              {reporteSeleccionado === "reporte_gastos" && (
                <div style={{ display: "grid", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 }}>
                    Ordenar por:
                    <select
                      value={filtros.ordenar_por}
                      onChange={(e) => setFiltros({ ...filtros, ordenar_por: e.target.value })}
                      className="select"
                    >
                      <option value="">Sin ordenar</option>
                      <option value="monto">Monto</option>
                      <option value="periodo">Período</option>
                    </select>
                  </label>
                  {filtros.ordenar_por && (
                    <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 }}>
                      Orden:
                      <select
                        value={filtros.orden}
                        onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
                        className="select"
                      >
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div className="actions">
                <button
                  onClick={handleGenerarReporte}
                  disabled={!reporteSeleccionado || isGenerating}
                  className="btn primary"
                >
                  {isGenerating ? "Generando..." : "Generar Reporte"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
