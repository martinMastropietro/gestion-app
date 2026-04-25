"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function GastoDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [gasto, setGasto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ descripcion: "", monto: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [comprobante, setComprobante] = useState(null); // File object — wire to API when ready
  const fileInputRef = useRef(null);

  useEffect(() => {
    apiRequest(`/api/gastos/${id}`)
      .then((data) => {
        setGasto(data);
        setForm({ descripcion: data.descripcion || "", monto: data.monto || "" });
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const updated = await apiRequest(`/api/gastos/${id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setGasto(updated ?? { ...gasto, ...form });
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) setComprobante(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setComprobante(file);
  }

  async function handleDelete() {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await apiRequest(`/api/gastos/${id}`, { method: "DELETE" });
      router.push("/gastos");
    } catch (err) {
      setError(err.message);
    }
  }

  // Placeholder date — replace with gasto.fecha when backend returns it
  const fechaDisplay = gasto?.fecha
    ? new Date(gasto.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .gd-root {
          min-height: 100vh;
          background: #f4f6f9;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          font-family: 'Space Grotesk', sans-serif;
          padding: 32px;
        }
        .gd-inner { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        /* TOPBAR */
        .gd-topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .gd-back {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #93aed6;
          letter-spacing: 1px; text-decoration: none;
          padding: 9px 14px;
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 8px; background: #fff;
          transition: border-color 0.15s;
        }
        .gd-back:hover { border-color: rgba(37,99,235,0.4); color: #2563eb; }
        .gd-topbar-actions { display: flex; gap: 8px; }
        .gd-btn-edit {
          padding: 9px 16px; background: #1e40af; color: #fff;
          border: none; border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .gd-btn-edit:hover { background: #1d3a9e; }
        .gd-btn-delete {
          padding: 9px 14px; background: #fff; color: #dc2626;
          border: 0.5px solid rgba(220,38,38,0.25); border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif;
          cursor: pointer; transition: border-color 0.15s;
        }
        .gd-btn-delete:hover { border-color: #dc2626; }

        /* MAIN CARD */
        .gd-card { background: #fff; border: 0.5px solid rgba(37,99,235,0.12); border-radius: 14px; overflow: hidden; }
        .gd-card-header {
          background: #1e3a8a; padding: 28px 32px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .gd-card-tag {
          font-family: 'Space Mono', monospace; font-size: 9px; color: #93c5fd;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .gd-card-tag::before { content: ''; width: 10px; height: 1px; background: #93c5fd; }
        .gd-card-title { font-size: 22px; font-weight: 600; color: #fff; letter-spacing: -0.3px; }
        .gd-card-monto { font-family: 'Space Mono', monospace; font-size: 32px; font-weight: 700; color: #fff; letter-spacing: -1px; margin-top: 4px; }

        .gd-card-body { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }

        /* INFO ROW */
        .gd-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        .gd-info-item { display: flex; flex-direction: column; gap: 4px; }
        .gd-info-label { font-family: 'Space Mono', monospace; font-size: 9px; color: #93aed6; letter-spacing: 1.5px; text-transform: uppercase; }
        .gd-info-val { font-size: 14px; color: #0f1f3d; font-weight: 500; }

        /* DIVIDER */
        .gd-divider { height: 0.5px; background: rgba(37,99,235,0.08); }

        /* EDIT FORM */
        .gd-edit-section { display: flex; flex-direction: column; gap: 14px; }
        .gd-section-label {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .gd-section-label::before { content: ''; width: 10px; height: 1px; background: #2563eb; }
        .gd-form-grid { display: grid; grid-template-columns: 1fr 200px; gap: 12px; align-items: end; }
        @media (max-width: 520px) { .gd-form-grid { grid-template-columns: 1fr; } }
        .gd-field { display: flex; flex-direction: column; gap: 6px; }
        .gd-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #2563eb; }
        .gd-input {
          padding: 10px 14px;
          border: 1px solid rgba(37,99,235,0.2); border-radius: 8px;
          background: #f8faff; color: #0f1f3d;
          font-size: 14px; font-family: 'Space Grotesk', sans-serif;
          outline: none; width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .gd-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .gd-input::placeholder { color: #b0bed6; }
        .gd-form-actions { display: flex; gap: 8px; }
        .gd-btn-save {
          padding: 10px 20px; background: #1e40af; color: #fff;
          border: none; border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif; font-weight: 500;
          cursor: pointer; transition: background 0.15s;
        }
        .gd-btn-save:hover:not(:disabled) { background: #1d3a9e; }
        .gd-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .gd-btn-cancel-edit {
          padding: 10px 14px; background: #fff; color: #6b7a99;
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif;
          cursor: pointer; transition: border-color 0.15s;
        }
        .gd-btn-cancel-edit:hover { border-color: rgba(37,99,235,0.4); color: #2563eb; }

        /* COMPROBANTE */
        .gd-upload-area {
          border: 1.5px dashed rgba(37,99,235,0.22); border-radius: 10px;
          padding: 28px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          background: #f8faff; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .gd-upload-area:hover, .gd-upload-area.drag-over {
          border-color: #2563eb; background: rgba(37,99,235,0.04);
        }
        .gd-upload-icon {
          width: 40px; height: 40px;
          background: rgba(37,99,235,0.08); border-radius: 8px;
          display: grid; place-items: center;
          border: 0.5px solid rgba(37,99,235,0.15);
        }
        .gd-upload-icon svg { width: 18px; height: 18px; stroke: #2563eb; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .gd-upload-text { font-size: 13px; color: #6b7a99; text-align: center; line-height: 1.5; }
        .gd-upload-text strong { color: #2563eb; font-weight: 500; }
        .gd-upload-sub { font-family: 'Space Mono', monospace; font-size: 9px; color: #b0bed6; letter-spacing: 1px; }

        .gd-file-preview {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(37,99,235,0.05);
          border: 0.5px solid rgba(37,99,235,0.2); border-radius: 8px;
          padding: 12px 16px;
        }
        .gd-file-name { font-size: 13px; color: #0f1f3d; font-weight: 500; }
        .gd-file-size { font-family: 'Space Mono', monospace; font-size: 10px; color: #93aed6; margin-top: 2px; }
        .gd-file-remove {
          background: none; border: none; color: #b0bed6; cursor: pointer;
          font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.5px;
        }
        .gd-file-remove:hover { color: #dc2626; }

        /* NOTICE */
        .gd-notice {
          font-family: 'Space Mono', monospace; font-size: 10px; color: #b0bed6;
          letter-spacing: 0.8px; display: flex; align-items: center; gap: 6px;
        }
        .gd-notice::before { content: '//'; color: #2563eb; }

        /* ERROR */
        .gd-error {
          font-size: 12px; color: #b00020; background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.2); border-radius: 8px;
          padding: 10px 14px; font-family: 'Space Mono', monospace;
        }

        /* LOADING */
        .gd-loading { padding: 80px 20px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: #b0bed6; letter-spacing: 1px; }
      `}</style>

      <div className="gd-root">
        <div className="gd-inner">

          <div className="gd-topbar">
            <Link href="/gastos" className="gd-back">← Gastos</Link>
            {gasto && (
              <div className="gd-topbar-actions">
                <button className="gd-btn-edit" onClick={() => setIsEditing((v) => !v)}>
                  {isEditing ? "Cancelar edición" : "Editar"}
                </button>
                <button className="gd-btn-delete" onClick={handleDelete}>Eliminar</button>
              </div>
            )}
          </div>

          {error && <div className="gd-error">{error}</div>}

          {isLoading ? (
            <div className="gd-loading">Cargando...</div>
          ) : gasto ? (
            <div className="gd-card">
              <div className="gd-card-header">
                <div className="gd-card-tag">Gasto #{id}</div>
                <div className="gd-card-title">{gasto.descripcion}</div>
                <div className="gd-card-monto">
                  ${Number(gasto.monto).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="gd-card-body">

                {/* INFO */}
                <div className="gd-info-grid">
                  <div className="gd-info-item">
                    <div className="gd-info-label">Fecha de registro</div>
                    <div className="gd-info-val">{fechaDisplay}</div>
                  </div>
                  <div className="gd-info-item">
                    <div className="gd-info-label">Estado</div>
                    <div className="gd-info-val">Activo</div>
                  </div>
                  <div className="gd-info-item">
                    <div className="gd-info-label">ID</div>
                    <div className="gd-info-val" style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px" }}>#{id}</div>
                  </div>
                </div>

                <div className="gd-divider" />

                {/* EDIT FORM */}
                {isEditing && (
                  <>
                    <div className="gd-edit-section">
                      <div className="gd-section-label">Editar gasto</div>
                      <form onSubmit={handleSave}>
                        <div className="gd-form-grid">
                          <div className="gd-field">
                            <label className="gd-label" htmlFor="gd-desc">Descripción</label>
                            <input id="gd-desc" className="gd-input" type="text" value={form.descripcion} onChange={(e) => updateField("descripcion", e.target.value)} required autoFocus />
                          </div>
                          <div className="gd-field">
                            <label className="gd-label" htmlFor="gd-monto">Monto ($)</label>
                            <input id="gd-monto" className="gd-input" type="number" min="0.01" step="0.01" value={form.monto} onChange={(e) => updateField("monto", e.target.value)} required />
                          </div>
                        </div>
                        <div className="gd-form-actions" style={{ marginTop: "12px" }}>
                          <button type="submit" className="gd-btn-save" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar cambios"}
                          </button>
                          <button type="button" className="gd-btn-cancel-edit" onClick={() => setIsEditing(false)}>Cancelar</button>
                        </div>
                      </form>
                    </div>
                    <div className="gd-divider" />
                  </>
                )}

                {/* COMPROBANTE */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="gd-section-label">Comprobante</div>

                  {comprobante ? (
                    <div className="gd-file-preview">
                      <div>
                        <div className="gd-file-name">{comprobante.name}</div>
                        <div className="gd-file-size">{(comprobante.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button className="gd-file-remove" onClick={() => setComprobante(null)}>quitar</button>
                    </div>
                  ) : (
                    <div
                      className="gd-upload-area"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
                      onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                      onDrop={(e) => { e.currentTarget.classList.remove("drag-over"); handleDrop(e); }}
                    >
                      <div className="gd-upload-icon">
                        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <div className="gd-upload-text">
                        <strong>Arrastrá o hacé click para subir</strong><br />
                        el comprobante del gasto
                      </div>
                      <div className="gd-upload-sub">PDF · JPG · PNG · máx. 10 MB</div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />

                  <div className="gd-notice">
                    La carga de comprobantes se conectará al backend próximamente.
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="gd-loading">Gasto no encontrado.</div>
          )}

        </div>
      </div>
    </>
  );
}