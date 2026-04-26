"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

const emptyForm = { unidad_id: "", fecha_pago: "", monto: "", observacion: "" };

export default function PagosPage() {
  const [pagos, setPagos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setError("");
    setIsLoading(true);
    try {
      const unidadesData = await apiRequest("/api/unidades/");
      setUnidades(unidadesData || []);
      const pagosData = await apiRequest("/api/pagos/");
      setPagos(pagosData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiRequest("/api/pagos/", { method: "POST", body: JSON.stringify(form) });
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deletePago(id) {
    if (!window.confirm("¿Eliminar este pago?")) return;
    try {
      await apiRequest(`/api/pagos/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatMoney(value) {
    return "$" + Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const unidadesById = new Map(unidades.map((unidad) => [unidad.id, unidad]));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .page { min-height: 100vh; background: #f4f6f9; padding: 32px; font-family: 'Space Grotesk', sans-serif; }
        .wrap { max-width: 1100px; margin: 0 auto; display: grid; gap: 24px; }
        .topbar, .grid, .actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .topbar { justify-content: space-between; }
        .tag, th { font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
        .tag { font-size: 10px; color: #2563eb; }
        .title { margin: 0; font-size: 28px; color: #0f1f3d; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 18px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); }
        .input, .select, .btn, .back { padding: 10px 12px; border-radius: 8px; }
        .input, .select { border: 1px solid rgba(37,99,235,.18); }
        .btn, .back { border: none; cursor: pointer; text-decoration: none; }
        .btn { background: #1e40af; color: #fff; }
        .back { background: #fff; color: #2563eb; border: 1px solid rgba(37,99,235,.18); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid rgba(37,99,235,.08); }
        th { font-size: 10px; color: #94a3b8; }
        .money { font-family: 'Space Mono', monospace; color: #1e3a8a; font-weight: 700; }
        .error { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; }
        .empty { text-align: center; color: #94a3b8; padding: 32px; }
        @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="page">
        <div className="wrap">
          <div className="topbar">
            <div>
              <div className="tag">Tesorería</div>
              <h1 className="title">Pagos</h1>
            </div>
            <Link href="/home" className="back">← volver</Link>
          </div>
          {error && <div className="error">{error}</div>}
          <form className="card" onSubmit={handleSubmit}>
            <div className="grid">
              <select className="select" value={form.unidad_id} onChange={(e) => setForm((current) => ({ ...current, unidad_id: e.target.value }))} required>
                <option value="">Unidad</option>
                {unidades.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>{unidad.piso}{unidad.apartamento} · {unidad.nombre_responsable}</option>
                ))}
              </select>
              <input className="input" type="date" value={form.fecha_pago} onChange={(e) => setForm((current) => ({ ...current, fecha_pago: e.target.value }))} required />
              <input className="input" type="number" min="0.01" step="0.01" placeholder="Monto" value={form.monto} onChange={(e) => setForm((current) => ({ ...current, monto: e.target.value }))} required />
              <input className="input" type="text" placeholder="Observación" value={form.observacion} onChange={(e) => setForm((current) => ({ ...current, observacion: e.target.value }))} />
            </div>
            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn" type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Registrar pago"}</button>
            </div>
          </form>
          <div className="card">
            {isLoading ? (
              <div className="empty">Cargando...</div>
            ) : pagos.length === 0 ? (
              <div className="empty">No hay pagos registrados.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Unidad</th>
                    <th>Periodo</th>
                    <th>Monto</th>
                    <th>Observación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    (() => {
                      const unidad = unidadesById.get(pago.unidad_id);
                      return (
                        <tr key={pago.id}>
                          <td>{pago.fecha_pago}</td>
                          <td>{unidad ? `${unidad.piso}${unidad.apartamento} - ${unidad.nombre_responsable}` : pago.unidad_id}</td>
                          <td>{String(pago.mes).padStart(2, "0")}/{pago.year}</td>
                          <td className="money">{formatMoney(pago.monto)}</td>
                          <td>{pago.observacion || "-"}</td>
                          <td><button className="back" onClick={() => deletePago(pago.id)}>eliminar</button></td>
                        </tr>
                      );
                    })()
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
