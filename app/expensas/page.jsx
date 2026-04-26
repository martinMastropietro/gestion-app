"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

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

  useEffect(() => {
    calcular(current);
  }, []);

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .page { min-height: 100vh; background: #f4f6f9; padding: 32px; font-family: 'Space Grotesk', sans-serif; }
        .wrap { max-width: 1100px; margin: 0 auto; display: grid; gap: 24px; }
        .topbar, .filters, .summary { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .topbar { justify-content: space-between; }
        .tag, .label, th { font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
        .tag { font-size: 10px; color: #2563eb; }
        .title { margin: 0; font-size: 28px; color: #0f1f3d; }
        .subtitle { margin: 4px 0 0; color: #64748b; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 18px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        .summary .accent { background: #1e3a8a; color: #fff; }
        .label { font-size: 10px; color: #93aed6; }
        .summary .accent .label { color: #bfdbfe; }
        .value { font-size: 24px; font-weight: 600; }
        .input, .btn, .back { border-radius: 8px; }
        .input { padding: 10px 12px; border: 1px solid rgba(37,99,235,.18); }
        .btn, .back { padding: 10px 14px; text-decoration: none; border: none; cursor: pointer; }
        .btn { background: #1e40af; color: #fff; }
        .back { background: #fff; color: #2563eb; border: 1px solid rgba(37,99,235,.18); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid rgba(37,99,235,.08); }
        th { font-size: 10px; color: #94a3b8; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(37,99,235,.08); color: #1e3a8a; font-family: 'Space Mono', monospace; }
        .money { font-family: 'Space Mono', monospace; color: #1e3a8a; font-weight: 700; }
        .bar-bg { width: 100%; height: 4px; background: rgba(37,99,235,.12); border-radius: 999px; overflow: hidden; margin-top: 6px; }
        .bar { height: 4px; background: #2563eb; }
        .error { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; }
        .empty { text-align: center; color: #94a3b8; padding: 32px; }
      `}</style>

      <div className="page">
        <div className="wrap">
          <div className="topbar">
            <div>
              <div className="tag">Cálculo</div>
              <h1 className="title">Expensas</h1>
            </div>
            <div className="topbar">
              <Link href="/home" className="back">← volver</Link>
              <button className="btn" onClick={() => calcular()} disabled={isRecalculating}>{isRecalculating ? "Calculando..." : "Recalcular"}</button>
            </div>
          </div>

          <div className="card filters">
            <span className="label">Periodo</span>
            <input className="input" type="number" min="1" max="12" value={period.mes} onChange={(e) => setPeriod((currentPeriod) => ({ ...currentPeriod, mes: e.target.value }))} />
            <input className="input" type="number" min="2000" max="9999" value={period.year} onChange={(e) => setPeriod((currentPeriod) => ({ ...currentPeriod, year: e.target.value }))} />
            <button className="btn" onClick={() => calcular(period)}>Calcular periodo</button>
          </div>

          {error && <div className="error">{error}</div>}

          {isLoading ? (
            <div className="card empty">Cargando...</div>
          ) : calculo ? (
            <>
              <div className="summary">
                <div className="card accent">
                  <div className="label">Total gastos</div>
                  <div className="value">${fmt(calculo.total_gastos)}</div>
                </div>
                <div className="card">
                  <div className="label">Superficie total</div>
                  <div className="value">{fmt(calculo.total_superficie)} m²</div>
                </div>
                <div className="card">
                  <div className="label">Periodo</div>
                  <div className="value">{String(calculo.mes).padStart(2, "0")}/{calculo.year}</div>
                </div>
              </div>

              <div className="card">
                {calculo.expensas.length === 0 ? (
                  <div className="empty">No hay datos para el periodo seleccionado.</div>
                ) : (
                  <table>
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
                        const barWidth = (Number(item.monto || 0) / maxMonto) * 100;
                        return (
                          <tr key={item.unidad_id}>
                            <td><span className="badge">{item.piso}{item.apartamento}</span></td>
                            <td>{item.nombre_responsable}</td>
                            <td>{fmt(item.superficie)} m²</td>
                            <td>{Number(item.porcentaje || 0).toFixed(4)}%</td>
                            <td className="money">
                              ${fmt(item.monto)}
                              <div className="bar-bg"><div className="bar" style={{ width: `${barWidth}%` }} /></div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="card empty">No hay datos para mostrar.</div>
          )}
        </div>
      </div>
    </>
  );
}
