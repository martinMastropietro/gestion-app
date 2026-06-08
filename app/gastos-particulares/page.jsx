"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

function currentPeriod() {
  const now = new Date();
  return { mes: String(now.getMonth() + 1), year: String(now.getFullYear()) };
}

const emptyForm = {
  descripcion: "",
  monto: "",
  unidad_id: "",
  mes: currentPeriod().mes,
  year: currentPeriod().year,
};

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function GastosParticularesPage() {
  const period = currentPeriod();
  const [gastos, setGastos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ mes: period.mes, year: period.year, unidad_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUnidades();
    loadGastos(filters);
  }, []);

  async function loadUnidades() {
    try {
      const data = await apiRequest("/api/unidades/");
      setUnidades(data || []);
    } catch {
      // non-blocking
    }
  }

  async function loadGastos(nextFilters = filters) {
    setError("");
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextFilters.mes) params.set("mes", nextFilters.mes);
      if (nextFilters.year) params.set("year", nextFilters.year);
      if (nextFilters.unidad_id) params.set("unidad_id", nextFilters.unidad_id);
      const data = await apiRequest(`/api/gastos-particulares/?${params.toString()}`);
      setGastos(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  function updateFilter(field, value) {
    setFilters((c) => ({ ...c, [field]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, mes: filters.mes, year: filters.year });
    setModalOpen(true);
  }

  function openEdit(g) {
    setEditingId(g.id);
    setForm({
      descripcion: g.descripcion || "",
      monto: String(g.monto || ""),
      unidad_id: g.unidad_id || "",
      mes: String(g.mes || filters.mes),
      year: String(g.year || filters.year),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm, mes: filters.mes, year: filters.year });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiRequest(editingId ? `/api/gastos-particulares/${editingId}` : "/api/gastos-particulares/", {
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
      await apiRequest(`/api/gastos-particulares/${id}`, { method: "DELETE" });
      await loadGastos();
    } catch (err) {
      setError(err.message);
    }
  }

  function unidadLabel(u) {
    return `${u.piso}${u.apartamento}`;
  }

  function unidadLabelById(id) {
    const u = unidades.find((u) => u.id === id);
    return u ? unidadLabel(u) : id;
  }

  const total = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);

  return (
    <DashboardLayout>
      <style>{`
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 6px 0 0; font-size: 32px; font-weight: 600; color: var(--text-main); }
        
        .btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-size: 14px; background: var(--primary); color: #fff; font-weight: 600; transition: all 0.2s; }
        .btn:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        
        .btn-action { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-light); cursor: pointer; background: #fff; color: #64748b; transition: all 0.2s; }
        .btn-action:hover { background: #f8fafc; color: var(--primary); border-color: var(--primary); }
        .btn-action.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }

        .card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        
        .filters { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
        .filters .label { font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; }
        .filters .input, .filters .select { padding: 8px 12px; border: 1px solid var(--border-light); border-radius: 8px; font-size: 14px; outline: none; background: #fff; }
        .filters .input { width: 90px; }
        
        .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .summary-item { background: #fff; padding: 16px 24px; border-radius: 16px; border: 1px solid var(--border-light); flex: 1; min-width: 180px; }
        .summary-item.accent { background: var(--sidebar-bg); color: #fff; border-color: var(--sidebar-bg); }
        .summary-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .summary-item.accent .summary-label { color: #93c5fd; }
        .summary-value { font-size: 24px; font-weight: 700; }

        .table-card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th { text-align: left; padding: 16px 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid var(--border-light); background: #fafbff; }
        td { padding: 16px 20px; border-bottom: 1px solid var(--border-light); font-size: 14px; }
        tr:last-child td { border-bottom: none; }
        
        .money { font-family: 'Space Mono', monospace; color: var(--sidebar-bg); font-weight: 700; }
        .badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; background: rgba(37,99,235,.08); color: var(--primary); font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 600; }
        .actions-cell { display: flex; gap: 8px; }
        
        .error { color: #ef4444; background: #fef2f2; border: 1px solid rgba(239, 68, 68, 0.2); padding: 16px; border-radius: 12px; margin-bottom: 24px; }
        .empty { color: #94a3b8; text-align: center; padding: 48px; font-size: 15px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15,31,61,.45); display: grid; place-items: center; padding: 24px; z-index: 100; }
        .modal-box { width: 100%; max-width: 520px; background: #fff; border-radius: 16px; border: 1px solid var(--border-light); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 24px 0; }
        .modal-title { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--primary); letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }
        .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; line-height: 1; }
        .modal-body { padding: 24px; display: grid; gap: 16px; }
        .modal-input, .modal-select { padding: 10px 12px; border: 1px solid var(--border-light); border-radius: 8px; font-size: 14px; outline: none; background: #fff; width: 100%; }
        .modal-input:focus, .modal-select:focus { border-color: var(--primary); }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 720px) { .modal-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Gestión</div>
          <h1 className="title">Gastos Particulares</h1>
        </div>
        <button className="btn" onClick={openCreate}>
          <Plus size={18} />
          Agregar gasto
        </button>
      </div>

      <div className="card filters">
        <span className="label">Periodo</span>
        <input className="input" type="number" min="1" max="12" placeholder="Mes" value={filters.mes} onChange={(e) => updateFilter("mes", e.target.value)} />
        <input className="input" type="number" min="2000" max="9999" placeholder="Año" value={filters.year} onChange={(e) => updateFilter("year", e.target.value)} />
        <select className="select" value={filters.unidad_id} onChange={(e) => updateFilter("unidad_id", e.target.value)}>
          <option value="">Todas las unidades</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>{unidadLabel(u)} — {u.nombre_responsable}</option>
          ))}
        </select>
        <button className="btn" style={{ padding: "8px 16px", fontSize: "13px" }} onClick={() => loadGastos(filters)}>
          <Search size={14} />
          Filtrar
        </button>
      </div>

      <div className="summary">
        <div className="summary-item accent">
          <div className="summary-label">Total del periodo</div>
          <div className="summary-value">${total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Cantidad</div>
          <div className="summary-value">{gastos.length}</div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-card">
        {isLoading ? (
          <div className="empty">Cargando...</div>
        ) : gastos.length === 0 ? (
          <div className="empty">No hay gastos particulares para el periodo seleccionado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Descripción</th>
                <th>Periodo</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td>
                    <span className="badge">
                      {g.unidades ? `${g.unidades.piso}${g.unidades.apartamento}` : unidadLabelById(g.unidad_id)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{g.descripcion}</td>
                  <td style={{ fontFamily: "Space Mono" }}>{String(g.mes).padStart(2, "0")}/{g.year}</td>
                  <td className="money">${Number(g.monto).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-action" onClick={() => openEdit(g)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-action danger" onClick={() => deleteGasto(g.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingId ? "// editar gasto" : "// nuevo gasto particular"} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <select
                className="modal-select"
                value={form.unidad_id}
                onChange={(e) => updateField("unidad_id", e.target.value)}
                required
              >
                <option value="">Seleccionar unidad...</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>{unidadLabel(u)} — {u.nombre_responsable}</option>
                ))}
              </select>
              <input className="modal-input" type="text" placeholder="Descripción" value={form.descripcion} onChange={(e) => updateField("descripcion", e.target.value)} required />
              <input className="modal-input" type="number" min="0.01" step="0.01" placeholder="Monto" value={form.monto} onChange={(e) => updateField("monto", e.target.value)} required />
              <div className="modal-grid">
                <input className="modal-input" type="number" min="1" max="12" placeholder="Mes" value={form.mes} onChange={(e) => updateField("mes", e.target.value)} required />
                <input className="modal-input" type="number" min="2000" max="9999" placeholder="Año" value={form.year} onChange={(e) => updateField("year", e.target.value)} required />
              </div>
              {error && <div className="error">{error}</div>}
              <div className="actions-cell" style={{ marginTop: "12px" }}>
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar gasto"}
                </button>
                <button type="button" className="btn" style={{ background: "#fff", color: "var(--primary)", border: "1px solid var(--border-light)" }} onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
