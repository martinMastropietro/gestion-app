"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .page { min-height: 100vh; padding: 32px; background: #f4f6f9; font-family: 'Space Grotesk', sans-serif; }
        .wrap { max-width: 1100px; margin: 0 auto; display: grid; gap: 24px; }
        .topbar, .filters, .summary { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .topbar { justify-content: space-between; }
        .title { font-size: 28px; color: #0f1f3d; margin: 0; }
        .tag, .label, th { font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
        .tag { font-size: 10px; color: #2563eb; }
        .btn, .back, .input, .select { border-radius: 8px; }
        .btn, .back { border: none; cursor: pointer; text-decoration: none; }
        .btn { background: #1e40af; color: #fff; padding: 10px 16px; font-family: 'Space Grotesk', sans-serif; font-size: 13px; }
        .back { background: #fff; color: #2563eb; border: 1px solid rgba(37,99,235,.18); padding: 10px 14px; font-size: 13px; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 18px; }
        .summary .card { min-width: 180px; }
        .summary .accent { background: #1e3a8a; color: #fff; }
        .summary .label { font-size: 10px; color: #93aed6; }
        .summary .accent .label { color: #bfdbfe; }
        .summary .value { font-size: 24px; font-weight: 600; }
        .filters .input, .filters .select, .modal-input, .modal-select { padding: 10px 12px; border: 1px solid rgba(37,99,235,.18); background: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 13px; color: #0f1f3d; }
        .table-card { overflow: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid rgba(37,99,235,.08); }
        th { font-size: 10px; color: #94a3b8; }
        td { color: #0f1f3d; }
        .money { font-family: 'Space Mono', monospace; color: #1e3a8a; font-weight: 700; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; background: rgba(37,99,235,.08); color: #2563eb; font-size: 12px; font-family: 'Space Mono', monospace; font-weight: 700; }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .ghost { background: #fff; color: #2563eb; border: 1px solid rgba(37,99,235,.18); }
        .danger { background: #fff; color: #dc2626; border: 1px solid rgba(220,38,38,.18); }
        .error { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,31,61,.45); display: grid; place-items: center; padding: 24px; z-index: 100; }
        .modal-box { width: 100%; max-width: 520px; background: #fff; border-radius: 14px; }
        .modal-header, .modal-body { padding: 20px 24px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0; }
        .modal-title { font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb; letter-spacing: 2px; text-transform: uppercase; }
        .modal-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #64748b; }
        .modal-body { display: grid; gap: 12px; }
        .modal-input, .modal-select { width: 100%; border-radius: 8px; outline: none; }
        .modal-input:focus, .modal-select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .empty { text-align: center; color: #94a3b8; padding: 32px; }
        @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page">
        <div className="wrap">
          <div className="topbar">
            <div>
              <div className="tag">Gestión</div>
              <h1 className="title">Gastos Particulares</h1>
            </div>
            <div className="topbar">
              <Link href="/home" className="back">← volver</Link>
              <button className="btn" onClick={openCreate}>Agregar gasto</button>
            </div>
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
            <button className="btn" onClick={() => loadGastos(filters)}>Filtrar</button>
          </div>

          <div className="summary">
            <div className="card accent">
              <div className="label">Total del periodo</div>
              <div className="value">${total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="card">
              <div className="label">Cantidad</div>
              <div className="value">{gastos.length}</div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="card table-card">
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
                      <td>{g.descripcion}</td>
                      <td>{String(g.mes).padStart(2, "0")}/{g.year}</td>
                      <td className="money">${Number(g.monto).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <div className="actions">
                          <button className="back ghost" onClick={() => openEdit(g)}>editar</button>
                          <button className="back danger" onClick={() => deleteGasto(g.id)}>eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
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
              <div className="grid">
                <input className="modal-input" type="number" min="1" max="12" placeholder="Mes" value={form.mes} onChange={(e) => updateField("mes", e.target.value)} required />
                <input className="modal-input" type="number" min="2000" max="9999" placeholder="Año" value={form.year} onChange={(e) => updateField("year", e.target.value)} required />
              </div>
              {error && <div className="error">{error}</div>}
              <div className="actions">
                <button type="submit" className="btn" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar gasto"}</button>
                <button type="button" className="back ghost" onClick={closeModal}>Cancelar</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
