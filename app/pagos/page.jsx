"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { CreditCard, Plus, Trash2, Calendar, User } from "lucide-react";

const emptyForm = { unidad_id: "", fecha_pago: "", monto: "", observacion: "" };

export default function PagosPage() {
  const [pagos, setPagos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

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

  async function handleSubmit(e) {
    e.preventDefault();
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
    if (!window.confirm("¿Eliminar este registro de pago?")) return;
    try {
      await apiRequest(`/api/pagos/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatMoney(value) {
    return "$" + Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 });
  }

  const unidadesById = new Map(unidades.map((u) => [u.id, u]));

  return (
    <DashboardLayout>
      <style>{`
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 6px 0 0; font-size: 32px; font-weight: 600; color: var(--text-main); }
        
        .form-card { background: #fff; padding: 24px; border-radius: 20px; border: 1px solid var(--border-light); margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .form-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 2fr; gap: 16px; align-items: flex-end; }
        @media (max-width: 1024px) { .form-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }

        .field { display: flex; flex-direction: column; gap: 8px; }
        .label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--primary); text-transform: uppercase; }
        .input, .select { padding: 12px 16px; border: 1.5px solid var(--border-light); border-radius: 12px; font-family: 'Space Grotesk', sans-serif; font-size: 14px; outline: none; }
        .input:focus, .select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

        .btn-submit { 
          display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; 
          background: var(--primary); color: #fff; border: none; border-radius: 12px; 
          font-weight: 600; cursor: pointer; transition: all 0.2s; height: 46px;
        }
        .btn-submit:hover { background: var(--primary-dark); transform: translateY(-1px); }

        .table-card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid var(--border-light); background: #fafbff; }
        td { padding: 16px 20px; border-bottom: 1px solid var(--border-light); font-size: 14px; }
        
        .money { font-family: 'Space Mono', monospace; font-weight: 700; color: #16a34a; }
        .unit-info { display: flex; align-items: center; gap: 10px; }
        .unit-pill { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: var(--primary); background: rgba(37,99,235,0.07); padding: 2px 8px; border-radius: 4px; }
        
        .btn-delete { color: #94a3b8; background: none; border: none; cursor: pointer; transition: color 0.2s; padding: 4px; }
        .btn-delete:hover { color: #ef4444; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Tesorería</div>
          <h1 className="title">Registro de Pagos</h1>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label className="label">Unidad / Responsable</label>
            <select className="select" value={form.unidad_id} onChange={(e) => setForm(f => ({ ...f, unidad_id: e.target.value }))} required>
              <option value="">Seleccionar unidad...</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.piso}{u.apartamento} — {u.nombre_responsable}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Fecha</label>
            <input className="input" type="date" value={form.fecha_pago} onChange={(e) => setForm(f => ({ ...f, fecha_pago: e.target.value }))} required />
          </div>
          <div className="field">
            <label className="label">Monto ($)</label>
            <input className="input" type="number" step="0.01" placeholder="0.00" value={form.monto} onChange={(e) => setForm(f => ({ ...f, monto: e.target.value }))} required />
          </div>
          <div className="field">
            <label className="label">Observación</label>
            <input className="input" placeholder="Ej: Transferencia..." value={form.observacion} onChange={(e) => setForm(f => ({ ...f, observacion: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-submit" type="submit" disabled={isSubmitting}>
            <Plus size={18} />
            {isSubmitting ? "Registrando..." : "Registrar Pago"}
          </button>
        </div>
      </form>

      <div className="table-card">
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Cargando historial...</div>
        ) : pagos.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No hay pagos registrados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Unidad / Responsable</th>
                <th>Periodo Aplicado</th>
                <th>Monto</th>
                <th>Observación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => {
                const unidad = unidadesById.get(p.unidad_id);
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: "Space Mono", color: "#64748b" }}>{p.fecha_pago}</td>
                    <td>
                      <div className="unit-info">
                        <span className="unit-pill">{unidad ? `${unidad.piso}${unidad.apartamento}` : 'N/A'}</span>
                        <span style={{ fontWeight: 500 }}>{unidad?.nombre_responsable || '—'}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "Space Mono" }}>{String(p.mes).padStart(2, "0")}/{p.year}</td>
                    <td className="money">{formatMoney(p.monto)}</td>
                    <td style={{ color: "#64748b", fontStyle: p.observacion ? "normal" : "italic" }}>{p.observacion || "Sin observación"}</td>
                    <td>
                      <button className="btn-delete" onClick={() => deletePago(p.id)}>
                        <Trash2 size={16} />
                      </button>
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
