"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

export default function HomePage() {
  const [summary, setSummary] = useState(null);
  const [morosos, setMorosos] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const summaryData = await apiRequest("/api/overview/resumen");
        setSummary(summaryData);

        const morososData = await apiRequest("/api/overview/morosos_urgencia");
        setMorosos(morososData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  function formatMoney(value) {
    return "$" + Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <DashboardLayout>
      <style>{`
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 6px 0 0; font-size: 32px; font-weight: 600; color: var(--text-main); letter-spacing: -0.5px; }
        .status { font-family: 'Space Mono', monospace; font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 8px; }
        .status::before { content: ''; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .card.accent { background: var(--sidebar-bg); color: #fff; }
        .label { font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .card.accent .label { color: #93c5fd; }
        .value { font-size: 28px; font-weight: 700; margin-top: 12px; }
        .sublabel { color: #94a3b8; margin-top: 8px; font-size: 14px; }
        .card.accent .sublabel { color: rgba(255,255,255,.6); }
        
        .section-card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; overflow: hidden; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .section-title { font-family: 'Space Mono', monospace; color: var(--primary); font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th { text-align: left; padding: 12px 16px; font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid var(--border-light); }
        td { padding: 16px; border-bottom: 1px solid var(--border-light); font-size: 15px; }
        tr:last-child td { border-bottom: none; }
        
        .money { font-family: 'Space Mono', monospace; color: var(--sidebar-bg); font-weight: 700; }
        .badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; background: rgba(37,99,235,.08); color: var(--primary); font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 600; }
        .badge-overdue { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .badge-ok { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        
        .error { color: #ef4444; background: #fef2f2; border: 1px solid rgba(239, 68, 68, 0.2); padding: 16px; border-radius: 12px; margin-bottom: 20px; }
        .empty { color: #94a3b8; text-align: center; padding: 48px; font-size: 15px; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Administración</div>
          <h1 className="title">Resumen General</h1>
        </div>
        <div className="status">{isLoading ? "Cargando..." : "Operativo"}</div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid">
        <div className="card accent">
          <div className="label">Gastos comunes</div>
          <div className="value">{formatMoney(summary?.total_gastos)}</div>
          <div className="sublabel">Suma acumulada registrada</div>
        </div>
        <div className="card">
          <div className="label">Unidades</div>
          <div className="value">{summary?.total_unidades ?? 0}</div>
          <div className="sublabel">Unidades registradas</div>
        </div>
        <div className="card">
          <div className="label">Deuda total</div>
          <div className="value">{formatMoney(summary?.deuda_total)}</div>
          <div className="sublabel">Calculada a hoy</div>
        </div>
        <div className="card">
          <div className="label">Morosos</div>
          <div className="value">{morosos.length}</div>
          <div className="sublabel">Unidades con deuda positiva</div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Morosos · urgencia</div>
        </div>
        {morosos.length === 0 ? (
          <div className="empty">No hay deudas pendientes en el consorcio.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Unidad</th>
                  <th>Propietario</th>
                  <th>Deuda</th>
                  <th>Días / vencimiento</th>
                  <th>Último pago</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {morosos.map((moroso, idx) => {
                  const dias = moroso.dias_atraso;
                  const overdue = dias !== null && dias > 0;
                  const diasLabel = dias === null
                    ? "—"
                    : dias > 0
                      ? `${dias}d vencido`
                      : dias === 0
                        ? "vence hoy"
                        : `${-dias}d restantes`;
                  const estado = dias === null ? "—" : overdue ? "Vencido" : "Al día";
                  return (
                    <tr key={moroso.unidad_id}>
                      <td style={{ color: "#94a3b8", fontFamily: "Space Mono, monospace", fontSize: 11 }}>{idx + 1}</td>
                      <td><span className="badge">{moroso.unidad}</span></td>
                      <td>{moroso.propietario}</td>
                      <td className="money">{formatMoney(moroso.deuda_total)}</td>
                      <td style={{ fontFamily: "Space Mono, monospace", fontSize: 13, color: overdue ? "#ef4444" : "#22c55e" }}>
                        {diasLabel}
                      </td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{moroso.ultimo_pago || "—"}</td>
                      <td>
                        <span className={`badge ${overdue ? "badge-overdue" : "badge-ok"}`}>
                          {estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
