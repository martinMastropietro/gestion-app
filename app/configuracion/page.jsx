"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({ comision_porcentaje: 0 });
  const [form, setForm] = useState({ comision_porcentaje: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiRequest("/api/configuracion/")
      .then((data) => {
        setConfig(data);
        setForm({
          comision_porcentaje: String(data.comision_porcentaje ?? 0),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const updated = await apiRequest("/api/configuracion/", {
        method: "PATCH",
        body: JSON.stringify({
          comision_porcentaje: Number(form.comision_porcentaje),
        }),
      });
      setConfig(updated);
      setSuccess("Configuración guardada correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <style>{`
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 6px 0 0; font-size: 32px; font-weight: 600; color: var(--text-main); }
        
        .card { background: #fff; border: 1px solid var(--border-light); border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: grid; gap: 20px; margin-bottom: 24px; }
        .field { display: grid; gap: 8px; }
        .field label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
        .field .hint { font-size: 13px; color: #94a3b8; margin-top: 4px; }
        .input-row { display: flex; align-items: center; gap: 8px; }
        .input { padding: 10px 12px; border: 1px solid var(--border-light); border-radius: 8px; font-size: 15px; width: 120px; outline: none; }
        .pct { font-family: 'Space Mono', monospace; color: #64748b; font-size: 14px; }
        .btn { padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-size: 14px; background: var(--primary); color: #fff; font-weight: 600; transition: all 0.2s; width: fit-content; }
        .btn:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .actions { display: flex; gap: 10px; margin-top: 4px; }
        .error { color: #ef4444; background: #fef2f2; border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px 14px; border-radius: 8px; }
        .success { color: #15803d; background: #f0fdf4; border: 1px solid rgba(22,163,74,.2); padding: 12px 14px; border-radius: 8px; }
        .current-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .current-item { background: #f8fafc; border-radius: 8px; padding: 12px 16px; border: 1px solid var(--border-light); }
        .current-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .current-value { font-size: 22px; font-weight: 600; color: var(--primary); margin-top: 4px; }
      `}</style>

      <div className="topbar">
        <div>
          <div className="tag">Administración</div>
          <h1 className="title">Configuración</h1>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Cargando configuración...</div>
      ) : (
        <div style={{ maxWidth: "640px" }}>
          <div className="card">
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: 1.5, textTransform: "uppercase" }}>Valores actuales</div>
            <div className="current-row">
              <div className="current-item">
                <div className="current-label">Comisión administrador</div>
                <div className="current-value">{config.comision_porcentaje ?? 0}%</div>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <form className="card" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="comision">Comisión del administrador (%)</label>
              <div className="input-row">
                <input
                  id="comision"
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.comision_porcentaje}
                  onChange={(e) => setForm((f) => ({ ...f, comision_porcentaje: e.target.value }))}
                  required
                />
                <span className="pct">%</span>
              </div>
              <div className="hint">Se suma al total de gastos comunes antes de distribuir entre unidades. Ej: 5 = 5%.</div>
            </div>

            <div className="actions">
              <button className="btn" type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
