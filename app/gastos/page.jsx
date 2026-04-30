"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, X, Edit2, Trash2, Search, Eye } from "lucide-react";
import Link from "next/link";

function currentPeriod() {
  const now = new Date();
  return { mes: String(now.getMonth() + 1), year: String(now.getFullYear()) };
}

const emptyForm = {
  descripcion: "",
  monto: "",
  mes: currentPeriod().mes,
  year: currentPeriod().year,
  se_repite_mensualmente: false,
};

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function GastosPage() {
  const period = currentPeriod();
  const [gastos, setGastos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ mes: period.mes, year: period.year });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadGastos(filters); }, []);

  async function loadGastos(nextFilters = filters) {
    setError("");
    setIsLoading(true);
    try {
      const params = new URLSearchParams(nextFilters);
      const data = await apiRequest(`/api/gastos/?${params.toString()}`);
      setGastos(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, mes: filters.mes, year: filters.year });
    setModalOpen(true);
  };

  const openEdit = (gasto) => {
    setEditingId(gasto.id);
    setForm({
      descripcion: gasto.descripcion || "",
      monto: String(gasto.monto || ""),
      mes: String(gasto.mes || filters.mes),
      year: String(gasto.year || filters.year),
      se_repite_mensualmente: Boolean(gasto.se_repite_mensualmente),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiRequest(editingId ? `/api/gastos/${editingId}` : "/api/gastos/", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      closeModal();
      await loadGastos();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteGasto(id) {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await apiRequest(`/api/gastos/${id}`, { method: "DELETE" });
      await loadGastos();
    } catch (err) {
      setError(err.message);
    }
  }

  const total = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);

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

        .filters-bar { background: #fff; padding: 16px 24px; border-radius: 16px; border: 1px solid var(--border-light); display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .filter-group { display: flex; align-items: center; gap: 12px; }
        .filter-label { font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; }
        .filter-input { padding: 8px 12px; border: 1px solid var(--border-light); border-radius: 8px; font-family: 'Space Mono'; font-size: 13px; width: 80px; outline: none; }
        .filter-input:focus { border-color: var(--primary); }

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
        tr:hover td { background: #fafbff; }
        
        .money { font-family: 'Space Mono', monospace; font-weight: 700; color: var(--sidebar-bg); }
        .badge { font-family: 'Space Mono', monospace; font-size: 9px; padding: 2px 8px; border-radius: 999px; background: rgba(37,99,235,0.07); color: var(--primary); }

        .actions { display: flex; gap: 8px; }
        .btn-icon { background: #fff; border: 1px solid var(--border-light); border-radius: 8px; width: 32px; height: 32px; display: grid; place-items: center; color: #64748b; cursor: pointer; transition: all 0.2s; text-decoration: none; }
        .btn-icon:hover { color: var(--primary); border-color: var(--primary); background: rgba(37,99,235,0.04); }
        .btn-icon.delete:hover { color: #ef4444; border-color: #ef4444; background: #fef2f2; }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 31, 61, 0.5); backdrop-filter: blur(4px); display: grid; place-items: center; z-index: 1000; padding: 20px; }
        .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 500px; overflow: hidden; animation: slideUp 0.3s ease; }
        .modal-header { padding: 24px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; }
        .modal-close { background: none; border: none; color: #94a3b8; cursor: pointer; }
        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--primary); text-transform: uppercase; }
        .input { padding: 12px 16px; border: 1.5px solid var(--border-light); border-radius: 12px; font-family: 'Space Grotesk', sans-serif; font-size: 14px; outline: none; }
        .input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
        .modal-footer { padding: 0 24px 24px; display: flex; gap: 12px; }
        .btn-submit { flex: 1; padding: 12px; background: var(--primary); color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; }
        .btn-cancel { padding: 12px 20px; background: #fff; color: #64748b; border: 1.5px solid var(--border-light); border-radius: 12px; font-weight: 600; cursor: pointer; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Administración</div>
          <h1 className="title">Gastos Comunes</h1>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Nuevo Gasto
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <span className="filter-label">Mes</span>
          <input className="filter-input" type="number" min="1" max="12" value={filters.mes} onChange={(e) => setFilters(f => ({ ...f, mes: e.target.value }))} />
        </div>
        <div className="filter-group">
          <span className="filter-label">Año</span>
          <input className="filter-input" type="number" min="2000" max="9999" value={filters.year} onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))} />
        </div>
        <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => loadGastos()}>
          <Search size={14} />
          Filtrar
        </button>
      </div>

      <div className="summary-row">
        <div className="summary-item accent">
          <div className="summary-label">Total del Periodo</div>
          <div className="summary-value">${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Cant. Registros</div>
          <div className="summary-value">{gastos.length}</div>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

      <div className="table-card">
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Cargando gastos...</div>
        ) : gastos.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>No hay gastos en este periodo.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Periodo</th>
                <th>Monto</th>
                <th>Recurrencia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600 }}>{g.descripcion}</td>
                  <td style={{ fontFamily: "Space Mono" }}>{String(g.mes).padStart(2, "0")}/{g.year}</td>
                  <td className="money">${Number(g.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                  <td>{g.se_repite_mensualmente ? <span className="badge">MENSUAL</span> : <span style={{ color: "#94a3b8", fontSize: "11px" }}>PUNTUAL</span>}</td>
                  <td>
                    <div className="actions">
                      <Link href={`/gastos/${g.id}`} className="btn-icon"><Eye size={14} /></Link>
                      <button className="btn-icon" onClick={() => openEdit(g)}><Edit2 size={14} /></button>
                      <button className="btn-icon delete" onClick={() => deleteGasto(g.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingId ? "Editar Gasto" : "Nuevo Gasto"} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="field">
                <label className="label">Descripción</label>
                <input className="input" value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} required />
              </div>
              <div className="field">
                <label className="label">Monto ($)</label>
                <input className="input" type="number" step="0.01" value={form.monto} onChange={(e) => setForm(f => ({ ...f, monto: e.target.value }))} required />
              </div>
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="field">
                  <label className="label">Mes</label>
                  <input className="input" type="number" min="1" max="12" value={form.mes} onChange={(e) => setForm(f => ({ ...f, mes: e.target.value }))} required />
                </div>
                <div className="field">
                  <label className="label">Año</label>
                  <input className="input" type="number" min="2000" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} required />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.se_repite_mensualmente} onChange={(e) => setForm(f => ({ ...f, se_repite_mensualmente: e.target.checked }))} />
                Repetir todos los meses
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-submit">{isSubmitting ? "Guardando..." : "Confirmar"}</button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
