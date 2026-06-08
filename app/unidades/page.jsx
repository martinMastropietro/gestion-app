"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, X, Edit2, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";

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

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
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
    try {
      const data = await apiRequest("/api/unidades/");
      setUnidades(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const openCreate = () => {
    setEditingId(null);
    setEditingHasInquilino(false);
    setCodigoInput("");
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (u) => {
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
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (field, value) => {
    setForm((c) => ({ ...c, [field]: value }));
  };

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
    try {
      await apiRequest(`/api/unidades/${id}`, { method: "DELETE" });
      await loadUnidades();
    } catch (err) {
      setError(err.message);
    }
  }

  const superficieTotal = unidades.reduce((acc, u) => acc + Number(u.superficie || 0), 0);

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

        .summary-row { display: flex; gap: 16px; margin-bottom: 24px; }
        .summary-item { background: #fff; padding: 16px 24px; border-radius: 16px; border: 1px solid var(--border-light); }
        .summary-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .summary-value { font-size: 20px; font-weight: 700; color: var(--text-main); }

        .table-card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 16px 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid var(--border-light); background: #fafbff; }
        td { padding: 16px 20px; border-bottom: 1px solid var(--border-light); font-size: 14px; }
        tr:hover td { background: #fafbff; }
        
        .unit-badge { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: var(--primary); background: rgba(37,99,235,0.07); padding: 4px 10px; border-radius: 6px; }
        .status-badge { font-family: 'Space Mono', monospace; font-size: 9px; padding: 2px 8px; border-radius: 999px; margin-top: 6px; display: inline-flex; align-items: center; gap: 4px; }
        .status-linked { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
        .status-unlinked { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }

        .actions { display: flex; gap: 8px; }
        .btn-icon { background: #fff; border: 1px solid var(--border-light); border-radius: 8px; width: 32px; height: 32px; display: grid; place-items: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
        .btn-icon:hover { color: var(--primary); border-color: var(--primary); background: rgba(37,99,235,0.04); }
        .btn-icon.delete:hover { color: #ef4444; border-color: #ef4444; background: #fef2f2; }

        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 31, 61, 0.5); backdrop-filter: blur(4px); display: grid; place-items: center; z-index: 1000; padding: 20px; }
        .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 500px; overflow: hidden; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-header { padding: 24px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .modal-close { background: none; border: none; color: #94a3b8; cursor: pointer; }
        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--primary); text-transform: uppercase; }
        .input { padding: 12px 16px; border: 1.5px solid var(--border-light); border-radius: 12px; font-family: 'Space Grotesk', sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
        .modal-footer { padding: 0 24px 24px; display: flex; gap: 12px; }
        .btn-submit { flex: 1; padding: 12px; background: var(--primary); color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; }
        .btn-cancel { padding: 12px 20px; background: #fff; color: #64748b; border: 1.5px solid var(--border-light); border-radius: 12px; font-weight: 600; cursor: pointer; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Administración</div>
          <h1 className="title">Unidades</h1>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Nueva Unidad
        </button>
      </div>

      <div className="summary-row">
        <div className="summary-item">
          <div className="summary-label">Total Unidades</div>
          <div className="summary-value">{unidades.length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Sup. Total</div>
          <div className="summary-value">{superficieTotal.toFixed(2)} m²</div>
        </div>
      </div>

      {error && <div style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

      <div className="table-card">
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Cargando unidades...</div>
        ) : (
          <table>
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
                    <div className="unit-badge">{u.piso}{u.apartamento}</div>
                    <div className={`status-badge ${u.tiene_inquilino ? 'status-linked' : 'status-unlinked'}`}>
                      {u.tiene_inquilino ? 'VINCULADO' : 'SIN APP'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.nombre_responsable}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "Space Mono" }}>DNI {u.dni_responsable}</div>
                  </td>
                  <td>
                    <div style={{ color: "var(--primary)" }}>{u.mail_responsable}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{u.tel_responsable}</div>
                  </td>
                  <td style={{ fontFamily: "Space Mono" }}>{Number(u.superficie).toFixed(2)} m²</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => openEdit(u)}><Edit2 size={14} /></button>
                      <button className="btn-icon delete" onClick={() => deleteUnidad(u.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingId ? "Editar Unidad" : "Nueva Unidad"} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-grid">
                <div className="field">
                  <label className="label">Piso</label>
                  <input className="input" type="number" value={form.piso} onChange={(e) => updateField("piso", e.target.value)} required />
                </div>
                <div className="field">
                  <label className="label">Apto</label>
                  <input className="input" value={form.apartamento} onChange={(e) => updateField("apartamento", e.target.value)} required />
                </div>
              </div>
              
              <div className="field">
                <label className="label">Código de Acceso (Inquilino)</label>
                <input 
                  className="input" 
                  placeholder="Opcional" 
                  value={codigoInput} 
                  onChange={(e) => setCodigoInput(e.target.value.toUpperCase())} 
                  maxLength={6}
                />
              </div>

              <div className="field">
                <label className="label">Nombre Responsable</label>
                <input className="input" value={form.nombre_responsable} onChange={(e) => updateField("nombre_responsable", e.target.value)} disabled={editingHasInquilino} />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="label">DNI</label>
                  <input className="input" value={form.dni_responsable} onChange={(e) => updateField("dni_responsable", e.target.value)} disabled={editingHasInquilino} />
                </div>
                <div className="field">
                  <label className="label">Superficie m²</label>
                  <input className="input" type="number" step="0.01" value={form.superficie} onChange={(e) => updateField("superficie", e.target.value)} required />
                </div>
              </div>
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