"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function MorososPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setError("");
    apiRequest("/api/overview/morosos")
      .then((data) => setRows(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  function formatMoney(value) {
    return "$" + Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .page { min-height: 100vh; background: #f4f6f9; padding: 32px; font-family: 'Space Grotesk', sans-serif; }
        .wrap { max-width: 960px; margin: 0 auto; display: grid; gap: 24px; }
        .topbar { display: flex; justify-content: space-between; align-items: center; }
        .tag, th { font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
        .tag { font-size: 10px; color: #2563eb; }
        .title { margin: 0; font-size: 28px; color: #0f1f3d; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 18px; }
        .back { background: #fff; color: #2563eb; border: 1px solid rgba(37,99,235,.18); padding: 10px 14px; border-radius: 8px; text-decoration: none; }
        .error { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; }
        .empty { text-align: center; color: #94a3b8; padding: 32px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid rgba(37,99,235,.08); }
        th { font-size: 10px; color: #94a3b8; }
        .money { font-family: 'Space Mono', monospace; color: #1e3a8a; font-weight: 700; }
      `}</style>
      <div className="page">
        <div className="wrap">
          <div className="topbar">
            <div>
              <div className="tag">Cobranzas</div>
              <h1 className="title">Morosos</h1>
            </div>
            <Link href="/home" className="back">← volver</Link>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="card">
            {isLoading ? (
              <div className="empty">Cargando...</div>
            ) : rows.length === 0 ? (
              <div className="empty">No hay deuda pendiente.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Unidad</th>
                    <th>Propietario</th>
                    <th>Deuda total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.unidad_id}>
                      <td>{row.unidad}</td>
                      <td>{row.propietario}</td>
                      <td className="money">{formatMoney(row.deuda_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
