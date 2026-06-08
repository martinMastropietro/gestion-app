"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertTriangle, TrendingDown, Clock, CheckCircle } from "lucide-react";

export default function MorososPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/overview/morosos_urgencia")
      .then((data) => setRows(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  function formatMoney(value) {
    return "$" + Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 });
  }

  return (
    <DashboardLayout>
      <style>{`
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 6px 0 0; font-size: 32px; font-weight: 600; color: var(--text-main); }
        
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-card { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid var(--border-light); display: flex; align-items: center; gap: 16px; }
        .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; }
        .stat-content { display: flex; flex-direction: column; }
        .stat-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; }
        .stat-value { font-size: 20px; font-weight: 700; color: var(--text-main); }

        .table-card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid var(--border-light); background: #fafbff; }
        td { padding: 16px 20px; border-bottom: 1px solid var(--border-light); font-size: 14px; }
        
        .unit-pill { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: var(--primary); background: rgba(37,99,235,0.07); padding: 2px 8px; border-radius: 4px; }
        .money { font-family: 'Space Mono', monospace; font-weight: 700; color: #ef4444; }
        
        .status-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; padding: 4px 12px; border-radius: 999px; font-weight: 600; }
        .status-overdue { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .status-ok { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Cobranzas</div>
          <h1 className="title">Estado de Morosidad</h1>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><AlertTriangle size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Unidades Deudoras</span>
            <span className="stat-value">{rows.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><CheckCircle size={20} /></div>
          <div className="stat-content">
            <span className="stat-label">Deuda Total</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>{formatMoney(rows.reduce((acc, r) => acc + (r.deuda_total || 0), 0))}</span>
          </div>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

      <div className="table-card">
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Analizando deudas...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#22c55e" }}>¡Excelente! No hay unidades con deuda pendiente.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Propietario</th>
                <th>Deuda Acumulada</th>
                <th>Días de Atraso</th>
                <th>Último Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const dias = row.dias_atraso;
                const overdue = dias !== null && dias > 0;
                const diasLabel = dias === null ? "—" : dias > 0 ? `${dias}d vencido` : dias === 0 ? "Vence hoy" : `${-dias}d restantes`;
                return (
                  <tr key={row.unidad_id}>
                    <td><span className="unit-pill">{row.unidad}</span></td>
                    <td style={{ fontWeight: 600 }}>{row.propietario}</td>
                    <td className="money">{formatMoney(row.deuda_total)}</td>
                    <td style={{ fontFamily: "Space Mono", color: overdue ? "#ef4444" : "#22c55e" }}>
                      <div style={{ display: "flex", alignitems: "center", gap: "6px" }}>
                        <Clock size={14} />
                        {diasLabel}
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "13px" }}>{row.ultimo_pago || "Sin registros"}</td>
                    <td>
                      <span className={`status-badge ${overdue ? 'status-overdue' : 'status-ok'}`}>
                        {overdue ? 'VENCIDO' : 'AL DÍA'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
