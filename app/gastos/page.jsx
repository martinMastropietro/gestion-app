"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

const emptyForm = { descripcion: "", monto: "" };

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function GastosPage() {
  const [gastos, setGastos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadGastos(); }, []);

  async function loadGastos() {
    setError("");
    try {
      const data = await apiRequest("/api/gastos/");
      setGastos(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(gasto) {
    setEditingId(gasto.id);
    setForm({ descripcion: gasto.descripcion || "", monto: gasto.monto || "" });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
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
    setError("");
    try {
      await apiRequest(`/api/gastos/${id}`, { method: "DELETE" });
      await loadGastos();
    } catch (err) {
      setError(err.message);
    }
  }

  const total = gastos.reduce((acc, g) => acc + Number(g.monto || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .gp-root {
          min-height: 100vh;
          background: #f4f6f9;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          font-family: 'Space Grotesk', sans-serif;
          padding: 32px;
        }
        .gp-inner { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        .gp-topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .gp-title-area { display: flex; flex-direction: column; gap: 4px; }
        .gp-tag {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .gp-tag::before { content: ''; width: 14px; height: 1px; background: #2563eb; }
        .gp-title { font-size: 26px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.4px; }

        .gp-topbar-actions { display: flex; gap: 10px; align-items: center; }
        .gp-back {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #93aed6;
          letter-spacing: 1px; text-decoration: none;
          padding: 9px 14px;
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 8px; background: #fff;
          transition: border-color 0.15s;
        }
        .gp-back:hover { border-color: rgba(37,99,235,0.4); color: #2563eb; }
        .gp-btn-add {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 16px;
          background: #1e40af; color: #fff; border: none; border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .gp-btn-add:hover { background: #1d3a9e; }
        .gp-btn-add svg { width: 14px; height: 14px; stroke: #fff; fill: none; stroke-width: 2.5; stroke-linecap: round; }

        .gp-summary { display: flex; gap: 12px; flex-wrap: wrap; }
        .gp-summary-card {
          background: #fff; border: 0.5px solid rgba(37,99,235,0.12);
          border-radius: 10px; padding: 14px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .gp-summary-label { font-family: 'Space Mono', monospace; font-size: 9px; color: #93aed6; letter-spacing: 1.5px; text-transform: uppercase; }
        .gp-summary-val { font-size: 20px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.3px; }
        .gp-summary-card.accent { background: #1e3a8a; border-color: #1e3a8a; }
        .gp-summary-card.accent .gp-summary-label { color: #93c5fd; }
        .gp-summary-card.accent .gp-summary-val { color: #fff; }

        .gp-error {
          font-size: 12px; color: #b00020; background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.2); border-radius: 8px;
          padding: 10px 14px; font-family: 'Space Mono', monospace;
        }

        .gp-table-card { background: #fff; border: 0.5px solid rgba(37,99,235,0.12); border-radius: 12px; overflow: hidden; }
        .gp-table-header {
          padding: 16px 20px; border-bottom: 0.5px solid rgba(37,99,235,0.08);
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .gp-table-header::before { content: ''; width: 10px; height: 1px; background: #2563eb; }
        .gp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .gp-table th {
          text-align: left; font-family: 'Space Mono', monospace; font-size: 9px;
          color: #b0bed6; letter-spacing: 1px; text-transform: uppercase;
          padding: 12px 20px; font-weight: 400; background: #fafbff;
          border-bottom: 0.5px solid rgba(37,99,235,0.06);
        }
        .gp-table td { padding: 13px 20px; border-bottom: 0.5px solid rgba(37,99,235,0.05); color: #0f1f3d; vertical-align: middle; }
        .gp-table tr:last-child td { border-bottom: none; }
        .gp-table tr:hover td { background: #fafbff; }
        .gp-monto { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #1e3a8a; }
        .gp-action-cell { display: flex; gap: 8px; flex-wrap: wrap; }

        .gp-btn-view {
          padding: 6px 12px; background: rgba(37,99,235,0.06); color: #2563eb;
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 6px;
          font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .gp-btn-view:hover { border-color: #2563eb; background: rgba(37,99,235,0.1); }
        .gp-btn-edit {
          padding: 6px 12px; background: #fff; color: #2563eb;
          border: 0.5px solid rgba(37,99,235,0.3); border-radius: 6px;
          font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .gp-btn-edit:hover { border-color: #2563eb; background: rgba(37,99,235,0.04); }
        .gp-btn-delete {
          padding: 6px 12px; background: #fff; color: #dc2626;
          border: 0.5px solid rgba(220,38,38,0.25); border-radius: 6px;
          font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .gp-btn-delete:hover { border-color: #dc2626; background: rgba(220,38,38,0.04); }
        .gp-empty { padding: 48px 20px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: #b0bed6; letter-spacing: 1px; }

        /* ── MODAL ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,31,61,0.45);
          backdrop-filter: blur(3px);
          display: grid; place-items: center;
          z-index: 100; padding: 24px;
        }
        .modal-box {
          background: #fff; border-radius: 14px;
          border: 0.5px solid rgba(37,99,235,0.2);
          box-shadow: 0 20px 60px rgba(15,31,61,0.18);
          width: 100%; max-width: 440px;
          animation: modal-in 0.18s ease;
        }
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px 0;
        }
        .modal-title {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .modal-title::before { content: ''; width: 10px; height: 1px; background: #2563eb; }
        .modal-close {
          background: none; border: none; color: #b0bed6; cursor: pointer;
          padding: 4px; display: grid; place-items: center; border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }
        .modal-close:hover { color: #0f1f3d; background: rgba(37,99,235,0.06); }
        .modal-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }
        .modal-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-label {
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 1.5px; text-transform: uppercase; color: #2563eb;
        }
        .modal-input {
          padding: 10px 14px;
          border: 1px solid rgba(37,99,235,0.2); border-radius: 8px;
          background: #f8faff; color: #0f1f3d;
          font-size: 14px; font-family: 'Space Grotesk', sans-serif;
          outline: none; width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .modal-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .modal-input::placeholder { color: #b0bed6; }
        .modal-actions { display: flex; gap: 8px; padding-top: 4px; }
        .modal-btn-submit {
          flex: 1; padding: 11px;
          background: #1e40af; color: #fff; border: none; border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .modal-btn-submit:hover:not(:disabled) { background: #1d3a9e; }
        .modal-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .modal-btn-cancel {
          padding: 11px 16px; background: #fff; color: #6b7a99;
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif;
          cursor: pointer; transition: border-color 0.15s;
        }
        .modal-btn-cancel:hover { border-color: rgba(37,99,235,0.4); color: #2563eb; }
        .modal-error {
          font-size: 11px; color: #b00020; background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.15); border-radius: 6px;
          padding: 8px 12px; font-family: 'Space Mono', monospace;
        }
      `}</style>

      <div className="gp-root">
        <div className="gp-inner">
          <div className="gp-topbar">
            <div className="gp-title-area">
              <div className="gp-tag">Gestión</div>
              <h1 className="gp-title">Gastos Comunes</h1>
            </div>
            <div className="gp-topbar-actions">
              <Link href="/home" className="gp-back">← volver</Link>
              <button className="gp-btn-add" onClick={openCreate}>
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar gasto
              </button>
            </div>
          </div>

          <div className="gp-summary">
            <div className="gp-summary-card accent">
              <div className="gp-summary-label">Total gastos</div>
              <div className="gp-summary-val">
                ${total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="gp-summary-card">
              <div className="gp-summary-label">Cantidad</div>
              <div className="gp-summary-val">{gastos.length}</div>
            </div>
          </div>

          {error && <div className="gp-error">{error}</div>}

          <div className="gp-table-card">
            <div className="gp-table-header">Listado de gastos</div>
            {isLoading ? (
              <div className="gp-empty">Cargando...</div>
            ) : gastos.length === 0 ? (
              <div className="gp-empty">No hay gastos registrados.</div>
            ) : (
              <table className="gp-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g) => (
                    <tr key={g.id}>
                      <td>{g.descripcion}</td>
                      <td><span className="gp-monto">${Number(g.monto).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                      <td>
                        <div className="gp-action-cell">
                          <Link href={`/gastos/${g.id}`} className="gp-btn-view">ver más</Link>
                          <button className="gp-btn-edit" onClick={() => openEdit(g)}>editar</button>
                          <button className="gp-btn-delete" onClick={() => deleteGasto(g.id)}>eliminar</button>
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
        <Modal title={editingId ? "// editar gasto" : "// nuevo gasto"} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label" htmlFor="m-desc">Descripción</label>
                <input id="m-desc" className="modal-input" type="text" placeholder="Ej: Limpieza, Ascensor..." value={form.descripcion} onChange={(e) => updateField("descripcion", e.target.value)} required autoFocus />
              </div>
              <div className="modal-field">
                <label className="modal-label" htmlFor="m-monto">Monto ($)</label>
                <input id="m-monto" className="modal-input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.monto} onChange={(e) => updateField("monto", e.target.value)} required />
              </div>
              {error && <div className="modal-error">{error}</div>}
              <div className="modal-actions">
                <button type="submit" className="modal-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar gasto"}
                </button>
                <button type="button" className="modal-btn-cancel" onClick={closeModal}>Cancelar</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}