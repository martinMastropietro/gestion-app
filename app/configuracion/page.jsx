"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({ comision_porcentaje: 0, mora_porcentaje_mensual: 0 });
  const [form, setForm] = useState({ comision_porcentaje: "", mora_porcentaje_mensual: "" });
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
          mora_porcentaje_mensual: String(data.mora_porcentaje_mensual ?? 0),
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
          mora_porcentaje_mensual: Number(form.mora_porcentaje_mensual),
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .page { min-height: 100vh; background: #f4f6f9; padding: 32px; font-family: 'Space Grotesk', sans-serif; }
        .wrap { max-width: 640px; margin: 0 auto; display: grid; gap: 24px; }
        .topbar { display: flex; justify-content: space-between; align-items: center; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; }
        .title { margin: 4px 0 0; font-size: 28px; color: #0f1f3d; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 24px; display: grid; gap: 20px; }
        .field { display: grid; gap: 6px; }
        .field label { font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; }
        .field .hint { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .input-row { display: flex; align-items: center; gap: 8px; }
        .input { padding: 10px 12px; border: 1px solid rgba(37,99,235,.18); border-radius: 8px; font-size: 15px; width: 120px; }
        .pct { font-family: 'Space Mono', monospace; color: #64748b; font-size: 14px; }
        .btn, .back { padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; text-decoration: none; font-size: 14px; }
        .btn { background: #1e40af; color: #fff; }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .back { background: #fff; color: #2563eb; border: 1px solid rgba(37,99,235,.18); }
        .actions { display: flex; gap: 10px; margin-top: 4px; }
        .error { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; }
        .success { color: #15803d; background: #f0fdf4; border: 1px solid rgba(22,163,74,.2); padding: 12px 14px; border-radius: 8px; }
        .current-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .current-item { background: #f4f6f9; border-radius: 8px; padding: 12px 16px; }
        .current-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .current-value { font-size: 22px; font-weight: 600; color: #1e3a8a; margin-top: 4px; }
      `}</style>

      <div className="page">
        <div className="wrap">
          <div className="topbar">
            <div>
              <div className="tag">Administración</div>
              <h1 className="title">Configuración</h1>
            </div>
            <Link href="/home" className="back">← volver</Link>
          </div>

          {isLoading ? (
            <div className="card" style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>Cargando...</div>
          ) : (
            <>
              <div className="card">
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#2563eb", letterSpacing: 1.5, textTransform: "uppercase" }}>Valores actuales</div>
                <div className="current-row">
                  <div className="current-item">
                    <div className="current-label">Comisión administrador</div>
                    <div className="current-value">{config.comision_porcentaje ?? 0}%</div>
                  </div>
                  <div className="current-item">
                    <div className="current-label">Mora mensual</div>
                    <div className="current-value">{config.mora_porcentaje_mensual ?? 0}%</div>
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

                <div className="field">
                  <label htmlFor="mora">Mora mensual sobre saldo vencido (%)</label>
                  <div className="input-row">
                    <input
                      id="mora"
                      className="input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.mora_porcentaje_mensual}
                      onChange={(e) => setForm((f) => ({ ...f, mora_porcentaje_mensual: e.target.value }))}
                      required
                    />
                    <span className="pct">% / mes</span>
                  </div>
                  <div className="hint">Se aplica sobre el saldo impago de cada período vencido. Ej: 2 = 2% por mes de atraso.</div>
                </div>

                <div className="actions">
                  <button className="btn" type="submit" disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
