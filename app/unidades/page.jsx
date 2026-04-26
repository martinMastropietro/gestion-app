"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

const emptyForm = {
  piso: "", apartamento: "", nombre_responsable: "",
  dni_responsable: "", mail_responsable: "", tel_responsable: "", superficie: "",
};

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

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingHasInquilino, setEditingHasInquilino] = useState(false);
  const [codigoInput, setCodigoInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadUnidades(); }, []);

  async function loadUnidades() {
    setError("");
    try {
      const data = await apiRequest("/api/unidades/");
      setUnidades(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setEditingHasInquilino(false);
    setCodigoInput("");
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditingId(u.id);
    setEditingHasInquilino(!!u.tiene_inquilino);
    setCodigoInput("");
    setForm({
      piso: u.piso ?? "", apartamento: u.apartamento || "",
      nombre_responsable: u.nombre_responsable || "", dni_responsable: u.dni_responsable || "",
      mail_responsable: u.mail_responsable || "", tel_responsable: u.tel_responsable || "",
      superficie: u.superficie || "",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setEditingHasInquilino(false);
    setCodigoInput("");
    setForm(emptyForm);
    setError("");
  }

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const body = { ...form };
    if (codigoInput.trim()) body.codigo_acceso = codigoInput.trim().toUpperCase();
    try {
      await apiRequest(editingId ? `/api/unidades/${editingId}` : "/api/unidades/", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      closeModal();
      await loadUnidades();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteUnidad(id) {
    if (!window.confirm("¿Eliminar esta unidad?")) return;
    setError("");
    try {
      await apiRequest(`/api/unidades/${id}`, { method: "DELETE" });
      await loadUnidades();
    } catch (err) {
      setError(err.message);
    }
  }

  const superficieTotal = unidades.reduce((acc, u) => acc + Number(u.superficie || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .up-root {
          min-height: 100vh;
          background: #f4f6f9;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          font-family: 'Space Grotesk', sans-serif;
          padding: 32px;
        }
        .up-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        .up-topbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .up-title-area { display: flex; flex-direction: column; gap: 4px; }
        .up-tag {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .up-tag::before { content: ''; width: 14px; height: 1px; background: #2563eb; }
        .up-title { font-size: 26px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.4px; }

        .up-topbar-actions { display: flex; gap: 10px; align-items: center; }
        .up-back {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #93aed6;
          letter-spacing: 1px; text-decoration: none;
          padding: 9px 14px;
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 8px; background: #fff;
          transition: border-color 0.15s;
        }
        .up-back:hover { border-color: rgba(37,99,235,0.4); color: #2563eb; }
        .up-btn-add {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 16px;
          background: #1e40af; color: #fff; border: none; border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .up-btn-add:hover { background: #1d3a9e; }
        .up-btn-add svg { width: 14px; height: 14px; stroke: #fff; fill: none; stroke-width: 2.5; stroke-linecap: round; }

        .up-summary { display: flex; gap: 12px; flex-wrap: wrap; }
        .up-summary-card {
          background: #fff; border: 0.5px solid rgba(37,99,235,0.12);
          border-radius: 10px; padding: 14px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .up-summary-label { font-family: 'Space Mono', monospace; font-size: 9px; color: #93aed6; letter-spacing: 1.5px; text-transform: uppercase; }
        .up-summary-val { font-size: 20px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.3px; }
        .up-summary-card.accent { background: #1e3a8a; border-color: #1e3a8a; }
        .up-summary-card.accent .up-summary-label { color: #93c5fd; }
        .up-summary-card.accent .up-summary-val { color: #fff; }

        .up-error {
          font-size: 12px; color: #b00020; background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.2); border-radius: 8px;
          padding: 10px 14px; font-family: 'Space Mono', monospace;
        }

        .up-table-card { background: #fff; border: 0.5px solid rgba(37,99,235,0.12); border-radius: 12px; overflow: hidden; }
        .up-table-header {
          padding: 16px 20px; border-bottom: 0.5px solid rgba(37,99,235,0.08);
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .up-table-header::before { content: ''; width: 10px; height: 1px; background: #2563eb; }
        .up-table-wrap { overflow-x: auto; }
        .up-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .up-table th {
          text-align: left; font-family: 'Space Mono', monospace; font-size: 9px;
          color: #b0bed6; letter-spacing: 1px; text-transform: uppercase;
          padding: 12px 16px; font-weight: 400; background: #fafbff;
          border-bottom: 0.5px solid rgba(37,99,235,0.06); white-space: nowrap;
        }
        .up-table td { padding: 13px 16px; border-bottom: 0.5px solid rgba(37,99,235,0.05); color: #0f1f3d; vertical-align: middle; }
        .up-table tr:last-child td { border-bottom: none; }
        .up-table tr:hover td { background: #fafbff; }

        .up-unidad-badge {
          font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: #1e3a8a;
          background: rgba(37,99,235,0.07); border: 0.5px solid rgba(37,99,235,0.15);
          border-radius: 6px; padding: 4px 10px; display: inline-block;
        }
        .up-resp-name { font-weight: 500; }
        .up-resp-dni { font-family: 'Space Mono', monospace; font-size: 10px; color: #93aed6; margin-top: 2px; }
        .up-contact-mail { color: #2563eb; font-size: 12px; }
        .up-contact-tel { font-size: 12px; color: #6b7a99; margin-top: 2px; }
        .up-superficie { font-family: 'Space Mono', monospace; font-size: 12px; }
        .up-action-cell { display: flex; gap: 8px; flex-wrap: wrap; }
        .up-btn-edit {
          padding: 6px 12px; background: #fff; color: #2563eb;
          border: 0.5px solid rgba(37,99,235,0.3); border-radius: 6px;
          font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .up-btn-edit:hover { border-color: #2563eb; background: rgba(37,99,235,0.04); }
        .up-btn-delete {
          padding: 6px 12px; background: #fff; color: #dc2626;
          border: 0.5px solid rgba(220,38,38,0.25); border-radius: 6px;
          font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .up-btn-delete:hover { border-color: #dc2626; background: rgba(220,38,38,0.04); }
        .up-btn-vincular {
          padding: 6px 12px; background: #fff; color: #15803d;
          border: 0.5px solid rgba(22,163,74,0.3); border-radius: 6px;
          font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .up-btn-vincular:hover { border-color: #15803d; background: rgba(22,163,74,0.04); }
        .up-empty { padding: 48px 20px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: #b0bed6; letter-spacing: 1px; }
        .up-badge-linked { display: inline-flex; align-items: center; gap: 4px; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; background: rgba(22,163,74,.08); color: #15803d; border: 0.5px solid rgba(22,163,74,.2); margin-top: 4px; }
        .up-badge-unlinked { display: inline-flex; align-items: center; gap: 4px; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; background: rgba(148,163,184,.08); color: #94a3b8; border: 0.5px solid rgba(148,163,184,.2); margin-top: 4px; }

        /* ── MODAL ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,31,61,0.45); backdrop-filter: blur(3px);
          display: grid; place-items: center; z-index: 100; padding: 24px;
          overflow-y: auto;
        }
        .modal-box {
          background: #fff; border-radius: 14px;
          border: 0.5px solid rgba(37,99,235,0.2);
          box-shadow: 0 20px 60px rgba(15,31,61,0.18);
          width: 100%; max-width: 560px;
          animation: modal-in 0.18s ease;
          margin: auto;
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
        .modal-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .modal-grid { grid-template-columns: 1fr; } }
        .modal-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-label {
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 1.5px; text-transform: uppercase; color: #2563eb;
        }
        .modal-input {
          padding: 10px 14px;
          border: 1px solid rgba(37,99,235,0.2); border-radius: 8px;
          background: #f8faff; color: #0f1f3d;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif;
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
        .modal-divider { height: 0.5px; background: rgba(37,99,235,0.08); }
        .modal-error {
          font-size: 11px; color: #b00020; background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.15); border-radius: 6px;
          padding: 8px 12px; font-family: 'Space Mono', monospace;
        }
      `}</style>

      <div className="up-root">
        <div className="up-inner">

          <div className="up-topbar">
            <div className="up-title-area">
              <div className="up-tag">Gestión</div>
              <h1 className="up-title">Unidades</h1>
            </div>
            <div className="up-topbar-actions">
              <Link href="/home" className="up-back">← volver</Link>
              <button className="up-btn-add" onClick={openCreate}>
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar unidad
              </button>
            </div>
          </div>

          <div className="up-summary">
            <div className="up-summary-card accent">
              <div className="up-summary-label">Unidades registradas</div>
              <div className="up-summary-val">{unidades.length}</div>
            </div>
            <div className="up-summary-card">
              <div className="up-summary-label">Superficie total</div>
              <div className="up-summary-val">
                {superficieTotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²
              </div>
            </div>
          </div>

          {error && <div className="up-error">{error}</div>}

          <div className="up-table-card">
            <div className="up-table-header">Listado de unidades</div>
            {isLoading ? (
              <div className="up-empty">Cargando...</div>
            ) : unidades.length === 0 ? (
              <div className="up-empty">No hay unidades registradas.</div>
            ) : (
              <div className="up-table-wrap">
                <table className="up-table">
                  <thead>
                    <tr>
                      <th>Unidad</th>
                      <th>Responsable</th>
                      <th>Contacto</th>
                      <th>Superficie</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidades.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <span className="up-unidad-badge">{u.piso}{u.apartamento}</span>
                          <br />
                          <span className={u.tiene_inquilino ? "up-badge-linked" : "up-badge-unlinked"}>
                            {u.tiene_inquilino ? "● Vinculado" : "○ Sin app"}
                          </span>
                        </td>
                        <td>
                          <div className="up-resp-name">{u.nombre_responsable}</div>
                          <div className="up-resp-dni">DNI {u.dni_responsable}</div>
                        </td>
                        <td>
                          <div className="up-contact-mail">{u.mail_responsable}</div>
                          <div className="up-contact-tel">{u.tel_responsable}</div>
                        </td>
                        <td>
                          <span className="up-superficie">
                            {Number(u.superficie).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²
                          </span>
                        </td>
                        <td>
                          <div className="up-action-cell">
                            <button className="up-btn-edit" onClick={() => openEdit(u)}>editar</button>
                            <button className="up-btn-delete" onClick={() => deleteUnidad(u.id)}>eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {modalOpen && (
        <Modal title={editingId ? "// editar unidad" : "// nueva unidad"} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">

              {/* Piso + Apartamento — siempre requeridos */}
              <div className="modal-grid">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="u-piso">Piso</label>
                  <input id="u-piso" className="modal-input" type="number" min="0" placeholder="0" value={form.piso} onChange={(e) => updateField("piso", e.target.value)} required autoFocus />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="u-apt">Apartamento</label>
                  <input id="u-apt" className="modal-input" placeholder="Ej: A, 4B..." value={form.apartamento} onChange={(e) => updateField("apartamento", e.target.value)} required />
                </div>
              </div>

              <div className="modal-divider" />

              {/* Código de inquilino */}
              <div className="modal-field">
                <label className="modal-label" htmlFor="u-codigo">
                  {editingHasInquilino ? "¿El inquilino cambió? Pegá su nuevo código:" : "Si el inquilino ya creó su cuenta, pegá su código acá:"}
                </label>
                <input
                  id="u-codigo"
                  className="modal-input"
                  placeholder="Ej: H7K2MP  (opcional)"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ fontFamily: "'Space Mono', monospace", letterSpacing: 4, textTransform: "uppercase" }}
                />
              </div>

              <div className="modal-divider" />

            
              <div className="modal-grid">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="u-nombre">Responsable</label>
                  <input
                    id="u-nombre" className="modal-input" placeholder="Nombre completo"
                    value={form.nombre_responsable} onChange={(e) => updateField("nombre_responsable", e.target.value)}
                    disabled={editingHasInquilino}
                    style={editingHasInquilino ? { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" } : {}}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="u-dni">DNI</label>
                  <input
                    id="u-dni" className="modal-input" placeholder="00.000.000"
                    value={form.dni_responsable} onChange={(e) => updateField("dni_responsable", e.target.value)}
                    disabled={editingHasInquilino}
                    style={editingHasInquilino ? { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" } : {}}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="u-mail">Email</label>
                  <input
                    id="u-mail" className="modal-input" type="email" placeholder="correo@ejemplo.com"
                    value={form.mail_responsable} onChange={(e) => updateField("mail_responsable", e.target.value)}
                    disabled={editingHasInquilino}
                    style={editingHasInquilino ? { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" } : {}}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="u-tel">Teléfono</label>
                  <input
                    id="u-tel" className="modal-input" placeholder="+54 9 11..."
                    value={form.tel_responsable} onChange={(e) => updateField("tel_responsable", e.target.value)}
                    disabled={editingHasInquilino}
                    style={editingHasInquilino ? { background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" } : {}}
                  />
                </div>
              </div>

                {/* Datos de contacto — readonly si ya hay inquilino vinculado */}
                {editingHasInquilino && (
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#93aed6", fontFamily: "'Space Mono', monospace", letterSpacing: 0.3 }}>
                  Datos completados por el inquilino.
                </p>
              )}

              <div className="modal-divider" />

              <div className="modal-field">
                <label className="modal-label" htmlFor="u-sup">Superficie (m²)</label>
                <input id="u-sup" className="modal-input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.superficie} onChange={(e) => updateField("superficie", e.target.value)} required />
              </div>

              {error && <div className="modal-error">{error}</div>}

              <div className="modal-actions">
                <button type="submit" className="modal-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear unidad"}
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