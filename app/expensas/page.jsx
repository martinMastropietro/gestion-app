"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function ExpensasPage() {
  const [calculo, setCalculo] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => { calcular(); }, []);

  async function calcular() {
    setError("");
    setIsRecalculating(true);
    try {
      const data = await apiRequest("/api/expensas/calcular");
      setCalculo(data);
    } catch (err) {
      setError(err.message);
      setCalculo(null);
    } finally {
      setIsLoading(false);
      setIsRecalculating(false);
    }
  }

  function fmt(val) {
    return Number(val).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Derive max monto for the relative bar widths
  const maxMonto = calculo
    ? Math.max(...calculo.expensas.map((e) => Number(e.monto)))
    : 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ep-root {
          min-height: 100vh;
          background: #f4f6f9;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          font-family: 'Space Grotesk', sans-serif;
          padding: 32px;
        }
        .ep-inner { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        /* TOPBAR */
        .ep-topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .ep-title-area { display: flex; flex-direction: column; gap: 4px; }
        .ep-tag {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .ep-tag::before { content: ''; width: 14px; height: 1px; background: #2563eb; }
        .ep-title { font-size: 26px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.4px; }
        .ep-subtitle { font-size: 13px; color: #93aed6; font-weight: 300; margin-top: 2px; }

        .ep-topbar-actions { display: flex; gap: 10px; align-items: center; }
        .ep-back {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #93aed6;
          letter-spacing: 1px; text-decoration: none;
          padding: 9px 14px;
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 8px; background: #fff;
          transition: border-color 0.15s;
        }
        .ep-back:hover { border-color: rgba(37,99,235,0.4); color: #2563eb; }
        .ep-btn-calc {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 16px;
          background: #1e40af; color: #fff; border: none; border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .ep-btn-calc:hover:not(:disabled) { background: #1d3a9e; }
        .ep-btn-calc:disabled { opacity: 0.6; cursor: not-allowed; }
        .ep-btn-calc svg { width: 14px; height: 14px; stroke: #fff; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .ep-btn-calc.spinning svg { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ERROR */
        .ep-error {
          font-size: 12px; color: #b00020; background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.2); border-radius: 8px;
          padding: 10px 14px; font-family: 'Space Mono', monospace;
        }

        /* SUMMARY CARDS */
        .ep-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
        .ep-summary-card {
          background: #fff; border: 0.5px solid rgba(37,99,235,0.12);
          border-radius: 10px; padding: 16px 20px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .ep-summary-card.accent { background: #1e3a8a; border-color: #1e3a8a; }
        .ep-summary-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #93aed6; }
        .ep-summary-card.accent .ep-summary-label { color: #93c5fd; }
        .ep-summary-val { font-size: 20px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.3px; }
        .ep-summary-card.accent .ep-summary-val { color: #fff; }
        .ep-summary-sub { font-size: 11px; color: #b0bed6; margin-top: 1px; }
        .ep-summary-card.accent .ep-summary-sub { color: rgba(255,255,255,0.35); }

        /* SKELETON */
        .ep-skeleton { display: flex; flex-direction: column; gap: 24px; }
        .ep-skeleton-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .ep-skel {
          border-radius: 10px; background: linear-gradient(90deg, #e8edf5 25%, #f0f4fb 50%, #e8edf5 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* TABLE CARD */
        .ep-table-card {
          background: #fff; border: 0.5px solid rgba(37,99,235,0.12);
          border-radius: 12px; overflow: hidden;
        }
        .ep-table-header {
          padding: 16px 20px; border-bottom: 0.5px solid rgba(37,99,235,0.08);
          display: flex; justify-content: space-between; align-items: center;
        }
        .ep-table-title {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .ep-table-title::before { content: ''; width: 10px; height: 1px; background: #2563eb; }
        .ep-table-count {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #b0bed6;
          letter-spacing: 1px;
        }

        .ep-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ep-table th {
          text-align: left; font-family: 'Space Mono', monospace; font-size: 9px;
          color: #b0bed6; letter-spacing: 1px; text-transform: uppercase;
          padding: 12px 20px; font-weight: 400; background: #fafbff;
          border-bottom: 0.5px solid rgba(37,99,235,0.06); white-space: nowrap;
        }
        .ep-table td { padding: 12px 20px; border-bottom: 0.5px solid rgba(37,99,235,0.05); color: #0f1f3d; vertical-align: middle; }
        .ep-table tr:last-child td { border-bottom: none; }
        .ep-table tr:hover td { background: #fafbff; }

        .ep-unidad-badge {
          font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700;
          color: #1e3a8a; background: rgba(37,99,235,0.07);
          border: 0.5px solid rgba(37,99,235,0.15);
          border-radius: 6px; padding: 4px 10px; display: inline-block;
          white-space: nowrap;
        }
        .ep-sup { font-family: 'Space Mono', monospace; font-size: 12px; color: #6b7a99; }
        .ep-pct { font-family: 'Space Mono', monospace; font-size: 12px; color: #2563eb; font-weight: 700; }

        /* MONTO with bar */
        .ep-monto-wrap { display: flex; flex-direction: column; gap: 5px; min-width: 140px; }
        .ep-monto-val { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #1e3a8a; }
        .ep-monto-bar-bg { height: 3px; background: rgba(37,99,235,0.1); border-radius: 2px; }
        .ep-monto-bar { height: 3px; background: #2563eb; border-radius: 2px; transition: width 0.4s ease; }

        .ep-empty { padding: 48px 20px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: #b0bed6; letter-spacing: 1px; }

        /* NOTICE */
        .ep-notice {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #b0bed6;
          letter-spacing: 0.8px; display: flex; align-items: center; gap: 8px;
          padding: 12px 16px;
          background: #fff; border: 0.5px solid rgba(37,99,235,0.08); border-radius: 8px;
        }
        .ep-notice::before { content: '//'; color: #2563eb; flex-shrink: 0; }
      `}</style>

      <div className="ep-root">
        <div className="ep-inner">

          {/* TOPBAR */}
          <div className="ep-topbar">
            <div className="ep-title-area">
              <div className="ep-tag">Cálculo</div>
              <h1 className="ep-title">Expensas</h1>
              <p className="ep-subtitle">Distribución proporcional por superficie.</p>
            </div>
            <div className="ep-topbar-actions">
              <Link href="/home" className="ep-back">← volver</Link>
              <button
                className={`ep-btn-calc${isRecalculating ? " spinning" : ""}`}
                onClick={calcular}
                disabled={isRecalculating}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                {isRecalculating ? "Calculando..." : "Recalcular"}
              </button>
            </div>
          </div>

          {error && <div className="ep-error">{error}</div>}

          {/* SUMMARY */}
          {isLoading ? (
            <div className="ep-skeleton">
              <div className="ep-skeleton-cards">
                <div className="ep-skel" style={{ height: 80 }} />
                <div className="ep-skel" style={{ height: 80 }} />
                <div className="ep-skel" style={{ height: 80 }} />
              </div>
              <div className="ep-skel" style={{ height: 320, borderRadius: 12 }} />
            </div>
          ) : calculo ? (
            <>
              <div className="ep-summary">
                <div className="ep-summary-card accent">
                  <div className="ep-summary-label">Total gastos</div>
                  <div className="ep-summary-val">${fmt(calculo.total_gastos)}</div>
                  <div className="ep-summary-sub">Suma de gastos comunes</div>
                </div>
                <div className="ep-summary-card">
                  <div className="ep-summary-label">Superficie total</div>
                  <div className="ep-summary-val">{fmt(calculo.total_superficie)} m²</div>
                  <div className="ep-summary-sub">Área registrada</div>
                </div>
                <div className="ep-summary-card">
                  <div className="ep-summary-label">Unidades</div>
                  <div className="ep-summary-val">{calculo.expensas.length}</div>
                  <div className="ep-summary-sub">Con expensa calculada</div>
                </div>
              </div>

              {/* TABLE */}
              <div className="ep-table-card">
                <div className="ep-table-header">
                  <div className="ep-table-title">Desglose por unidad</div>
                  <div className="ep-table-count">{calculo.expensas.length} unidades</div>
                </div>
                {calculo.expensas.length === 0 ? (
                  <div className="ep-empty">No hay unidades registradas.</div>
                ) : (
                  <table className="ep-table">
                    <thead>
                      <tr>
                        <th>Unidad</th>
                        <th>Responsable</th>
                        <th>Superficie</th>
                        <th>Porcentaje</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculo.expensas.map((item) => {
                        const barWidth = maxMonto > 0
                          ? (Number(item.monto) / maxMonto) * 100
                          : 0;
                        return (
                          <tr key={item.unidad_id}>
                            <td>
                              <span className="ep-unidad-badge">
                                {item.piso}{item.apartamento}
                              </span>
                            </td>
                            <td>{item.nombre_responsable}</td>
                            <td>
                              <span className="ep-sup">{fmt(item.superficie)} m²</span>
                            </td>
                            <td>
                              <span className="ep-pct">{Number(item.porcentaje).toFixed(4)}%</span>
                            </td>
                            <td>
                              <div className="ep-monto-wrap">
                                <div className="ep-monto-val">${fmt(item.monto)}</div>
                                <div className="ep-monto-bar-bg">
                                  <div className="ep-monto-bar" style={{ width: `${barWidth}%` }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="ep-notice">
                El cálculo se basa en la proporción de superficie de cada unidad sobre el total. Los montos se actualizan al recalcular.
              </div>
            </>
          ) : !error ? (
            <div className="ep-empty">No hay datos para mostrar.</div>
          ) : null}

        </div>
      </div>
    </>
  );
}