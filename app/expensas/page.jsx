"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Calculator, Search, Building } from "lucide-react";

function getCurrentPeriod() {
  const now = new Date();
  return { mes: String(now.getMonth() + 1), year: String(now.getFullYear()) };
}

export default function ExpensasPage() {
  const current = getCurrentPeriod();
  const [period, setPeriod] = useState(current);
  const [calculo, setCalculo] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => { calcular(current); }, []);

  async function calcular(target = period) {
    setError("");
    setIsRecalculating(true);
    try {
      const data = await apiRequest("/api/expensas/calcular", {
        method: "POST",
        body: JSON.stringify({ mes: target.mes, year: target.year }),
      });
      setCalculo(data);
    } catch (err) {
      setError(err.message);
      setCalculo(null);
    } finally {
      setIsLoading(false);
      setIsRecalculating(false);
    }
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const maxMonto = calculo ? Math.max(...calculo.expensas.map((item) => Number(item.monto || 0)), 1) : 1;

  return (
    <DashboardLayout>
      <style>{`
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 6px 0 0; font-size: 32px; font-weight: 600; color: var(--text-main); }
        
        .btn-primary { 
          display: flex; align-items: center; gap: 8px; padding: 10px 20px; 
          background: var(--primary); color: #fff; border: none; border-radius: 12px; 
          font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .filters-bar { background: #fff; padding: 16px 24px; border-radius: 16px; border: 1px solid var(--border-light); display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .filter-group { display: flex; align-items: center; gap: 12px; }
        .filter-label { font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; }
        .filter-input { padding: 8px 12px; border: 1px solid var(--border-light); border-radius: 8px; font-family: 'Space Mono'; font-size: 13px; width: 80px; outline: none; }

        .summary-row { display: flex; gap: 16px; margin-bottom: 24px; }
        .summary-item { background: #fff; padding: 16px 24px; border-radius: 16px; border: 1px solid var(--border-light); flex: 1; }
        .summary-item.accent { background: var(--sidebar-bg); color: #fff; border-color: var(--sidebar-bg); }
        .summary-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .summary-item.accent .summary-label { color: #93c5fd; }
        .summary-value { font-size: 24px; font-weight: 700; }

        .table-card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid var(--border-light); background: #fafbff; }
        td { padding: 16px 20px; border-bottom: 1px solid var(--border-light); font-size: 14px; }
        
        .unit-badge { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: var(--primary); background: rgba(37,99,235,0.07); padding: 4px 10px; border-radius: 6px; }
        .money { font-family: 'Space Mono', monospace; font-weight: 700; color: var(--sidebar-bg); }
        
        .bar-bg { width: 100px; height: 6px; background: rgba(37,99,235,0.1); border-radius: 999px; overflow: hidden; margin-top: 4px; }
        .bar { height: 100%; background: var(--primary); border-radius: 999px; }
        
        .error { color: #ef4444; background: #fef2f2; border: 1px solid rgba(239, 68, 68, 0.2); padding: 16px; border-radius: 12px; margin-bottom: 24px; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Administración</div>
          <h1 className="title">Cálculo de Expensas</h1>
        </div>
        <button className="btn-primary" onClick={() => calcular()} disabled={isRecalculating}>
          <Calculator size={18} />
          {isRecalculating ? "Calculando..." : "Recalcular"}
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <span className="filter-label">Mes</span>
          <input className="filter-input" type="number" min="1" max="12" value={period.mes} onChange={(e) => setPeriod(p => ({ ...p, mes: e.target.value }))} />
        </div>
        <div className="filter-group">
          <span className="filter-label">Año</span>
          <input className="filter-input" type="number" min="2000" value={period.year} onChange={(e) => setPeriod(p => ({ ...p, year: e.target.value }))} />
        </div>
        <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => calcular(period)}>
          <Search size={14} />
          Ver Periodo
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Cargando datos...</div>
      ) : calculo ? (
        <>
          <div className="summary-row">
            <div className="summary-item accent">
              <div className="summary-label">Total Gastos Periodo</div>
              <div className="summary-value">${fmt(calculo.total_gastos)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Sup. Total Consorcio</div>
              <div className="summary-value">{fmt(calculo.total_superficie)} m²</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Periodo</div>
              <div className="summary-value" style={{ fontFamily: "Space Mono" }}>{String(calculo.mes).padStart(2, "0")}/{calculo.year}</div>
            </div>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Responsable</th>
                  <th>Superficie</th>
                  <th>Coeficiente</th>
                  <th>Monto a Pagar</th>
                </tr>
              </thead>
              <tbody>
                {calculo.expensas.map((item) => {
                  const barWidth = (Number(item.monto || 0) / maxMonto) * 100;
                  return (
                    <tr key={item.unidad_id}>
                      <td><span className="unit-badge">{item.piso}{item.apartamento}</span></td>
                      <td style={{ fontWeight: 600 }}>{item.nombre_responsable}</td>
                      <td style={{ fontFamily: "Space Mono" }}>{fmt(item.superficie)} m²</td>
                      <td style={{ fontFamily: "Space Mono", color: "var(--primary)" }}>{(item.porcentaje || 0).toFixed(4)}%</td>
                      <td>
                        <div className="money">${fmt(item.monto)}</div>
                        <div className="bar-bg"><div className="bar" style={{ width: `${barWidth}%` }} /></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No hay datos para este periodo.</div>
      )}
    </DashboardLayout>
  );
}
