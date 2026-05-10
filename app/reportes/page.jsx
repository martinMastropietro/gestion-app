"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .root { min-height: 100vh; display: grid; grid-template-columns: 220px 1fr; background: #f4f6f9; font-family: 'Space Grotesk', sans-serif; }
        .sidebar { background: #0f1f3d; color: #e2e8f0; padding: 24px 16px; display: flex; flex-direction: column; gap: 10px; }
        .logo { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 1px; color: #93c5fd; margin-bottom: 10px; }
        .nav-link { color: #94a3c0; text-decoration: none; padding: 10px 12px; border-radius: 8px; }
        .nav-link:hover, .nav-link.active { background: rgba(59,130,246,.12); color: #fff; }
        .logout { margin-top: auto; background: none; border: none; color: #93aed6; text-align: left; cursor: pointer; }
        .main { padding: 28px 32px; display: grid; gap: 20px; }
        .topbar { display: flex; justify-content: space-between; align-items: center; }
        .tag, .label, th { font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
        .tag { font-size: 10px; color: #2563eb; }
        .title { margin: 6px 0 0; font-size: 28px; color: #0f1f3d; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 18px; }
        .card.form { display: grid; gap: 16px; }
        .input, .select, .btn { padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(37,99,235,.18); }
        .checkbox-group { display: grid; gap: 12px; }
        .checkbox-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border: 1px solid rgba(37,99,235,.12); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .checkbox-item:hover { background: rgba(37,99,235,.04); }
        .checkbox-item input { margin-top: 4px; cursor: pointer; }
        .checkbox-label { display: flex; flex-direction: column; gap: 2px; }
        .checkbox-label .name { font-weight: 500; color: #0f1f3d; }
        .checkbox-label .desc { font-size: 12px; color: #64748b; }
        .btn { border: none; cursor: pointer; padding: 12px 16px; font-size: 14px; font-weight: 500; }
        .btn.primary { background: #2563eb; color: #fff; }
        .btn.primary:hover:not(:disabled) { background: #1e40af; }
        .btn.primary:disabled { background: #cbd5e1; cursor: not-allowed; }
        .btn.success { background: #16a34a; color: #fff; }
        .btn.success:hover { background: #15803d; }
        .error { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; margin-bottom: 12px; }
        .success-box { background: #f0fdf4; border: 1px solid rgba(34,197,94,.3); border-radius: 8px; padding: 16px; }
        .success-message { color: #15803d; font-weight: 500; margin-bottom: 12px; }
        .download-link { color: #2563eb; text-decoration: none; padding: 10px 12px; border: 1px solid rgba(37,99,235,.3); border-radius: 8px; background: rgba(37,99,235,.05); display: inline-block; }
        .download-link:hover { background: rgba(37,99,235,.1); }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; }
        @media (max-width: 820px) { .root { grid-template-columns: 1fr; } .sidebar { grid-column: auto; } }
      `}</style>
      <div className="root">
        <aside className="sidebar">
          <div className="logo">Gestor</div>
          <Link href="/home" className="nav-link">
            Overview
          </Link>
          <Link href="/unidades" className="nav-link">
            Residentes
          </Link>
          <Link href="/gastos" className="nav-link">
            Gastos
          </Link>
          <Link href="/expensas" className="nav-link">
            Expensas
          </Link>
          <Link href="/pagos" className="nav-link">
            Pagos
          </Link>
          <Link href="/morosos" className="nav-link">
            Morosos
          </Link>
          <Link href="/reportes" className="nav-link active">
            Reportes
          </Link>
          <button
            className="logout"
            onClick={() => {
              window.localStorage.removeItem("userId");
              window.localStorage.removeItem("userRole");
              router.push("/");
            }}
          >
            Salir
          </button>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <div className="tag">Análisis</div>
              <h1 className="title">Reportes</h1>
            </div>
          </div>

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
                  <label className="label" style={{ marginBottom: "8px", display: "block" }}>
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
                  <div>
                    <label style={{ display: "block", marginBottom: "8px" }}>
                      Ordenar por:
                      <select
                        value={filtros.ordenar_por}
                        onChange={(e) => setFiltros({ ...filtros, ordenar_por: e.target.value })}
                        style={{ marginLeft: "8px", padding: "4px" }}
                      >
                        <option value="">Sin ordenar</option>
                        <option value="deuda_total">Deuda Total</option>
                      </select>
                    </label>
                    {filtros.ordenar_por && (
                      <label style={{ display: "block", marginBottom: "8px" }}>
                        Orden:
                        <select
                          value={filtros.orden}
                          onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
                          style={{ marginLeft: "8px", padding: "4px" }}
                        >
                          <option value="asc">Ascendente</option>
                          <option value="desc">Descendente</option>
                        </select>
                      </label>
                    )}
                  </div>
                )}

                {reporteSeleccionado === "reporte_pagos" && (
                  <div>
                    <label style={{ display: "block", marginBottom: "8px" }}>
                      Ordenar por:
                      <select
                        value={filtros.ordenar_por}
                        onChange={(e) => setFiltros({ ...filtros, ordenar_por: e.target.value })}
                        style={{ marginLeft: "8px", padding: "4px" }}
                      >
                        <option value="">Sin ordenar</option>
                        <option value="fecha_pago">Fecha de Pago</option>
                        <option value="monto">Monto</option>
                      </select>
                    </label>
                    {filtros.ordenar_por && (
                      <label style={{ display: "block", marginBottom: "8px" }}>
                        Orden:
                        <select
                          value={filtros.orden}
                          onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
                          style={{ marginLeft: "8px", padding: "4px" }}
                        >
                          <option value="asc">Ascendente</option>
                          <option value="desc">Descendente</option>
                        </select>
                      </label>
                    )}
                  </div>
                )}

                {reporteSeleccionado === "reporte_gastos" && (
                  <div>
                    <label style={{ display: "block", marginBottom: "8px" }}>
                      Ordenar por:
                      <select
                        value={filtros.ordenar_por}
                        onChange={(e) => setFiltros({ ...filtros, ordenar_por: e.target.value })}
                        style={{ marginLeft: "8px", padding: "4px" }}
                      >
                        <option value="">Sin ordenar</option>
                        <option value="monto">Monto</option>
                        <option value="periodo">Período</option>
                      </select>
                    </label>
                    {filtros.ordenar_por && (
                      <label style={{ display: "block", marginBottom: "8px" }}>
                        Orden:
                        <select
                          value={filtros.orden}
                          onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
                          style={{ marginLeft: "8px", padding: "4px" }}
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
        </main>
      </div>
    </>
  );
}
