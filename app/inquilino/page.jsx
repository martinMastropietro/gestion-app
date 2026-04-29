"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function InquilinoPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCode, setPendingCode] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Payment form state
  const [fechaPago, setFechaPago] = useState("");
  const [monto, setMonto] = useState("");
  const [observacion, setObservacion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pagoError, setPagoError] = useState("");
  const [pagoSuccess, setPagoSuccess] = useState("");

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    const userRole = window.localStorage.getItem("userRole");

    if (!storedUserId) {
      router.push("/login");
      return;
    }
    if (userRole === "encargado") {
      router.push("/home");
      return;
    }

    setUserId(storedUserId);

    const storedUnidadId = window.localStorage.getItem("userUnidadId");
    if (!storedUnidadId) {
      apiRequest(`/user/${storedUserId}`)
        .then((profile) => {
          if (profile.unidad_id) {
            window.localStorage.setItem("userUnidadId", profile.unidad_id);
            loadData(storedUserId);
          } else {
            setPendingCode(profile.codigo_acceso || "—");
            setIsLoading(false);
          }
        })
        .catch((err) => { setError(err.message); setIsLoading(false); });
      return;
    }

    loadData(storedUserId);
  }, [router]);

  // Poll every 5 s while waiting for the encargado to link the unit
  useEffect(() => {
    if (!pendingCode || !userId) return;

    const interval = setInterval(() => {
      apiRequest(`/user/${userId}`)
        .then((profile) => {
          if (profile.unidad_id) {
            clearInterval(interval);
            window.localStorage.setItem("userUnidadId", profile.unidad_id);
            setPendingCode(null);
            loadData(userId);
          }
        })
        .catch(() => {}); // silent — keep retrying
    }, 5000);

    return () => clearInterval(interval);
  }, [pendingCode, userId]);

  async function loadData(uid) {
    setIsLoading(true);
    setError("");
    try {
      const result = await apiRequest("/api/inquilino/deuda", {
        headers: { "X-User-Id": uid },
      });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(pendingCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch { setCodeCopied(false); }
  }

  async function handlePago(e) {
    e.preventDefault();
    setPagoError("");
    setPagoSuccess("");

    if (!fechaPago || !monto) {
      setPagoError("Fecha y monto son obligatorios.");
      return;
    }
    if (Number(monto) <= 0) {
      setPagoError("El monto debe ser mayor a cero.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("/api/inquilino/pago", {
        method: "POST",
        headers: { "X-User-Id": userId },
        body: JSON.stringify({ fecha_pago: fechaPago, monto: Number(monto), observacion }),
      });
      setPagoSuccess("Pago registrado correctamente.");
      setFechaPago("");
      setMonto("");
      setObservacion("");
      loadData(userId);
    } catch (err) {
      setPagoError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function computePeriodos(expensas, pagos) {
    const totalPagos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    let remaining = totalPagos;
    const sorted = [...expensas].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.mes - b.mes
    );
    return sorted.map((exp) => {
      const monto = Number(exp.monto);
      const pagado = Math.min(remaining, monto);
      remaining = Math.max(remaining - pagado, 0);
      const saldo = monto - pagado;
      const estado = pagado >= monto ? "saldado" : pagado > 0 ? "parcial" : "pendiente";
      return { ...exp, pagado, saldo, estado };
    }).reverse();
  }

  function handleLogout() {
    window.localStorage.removeItem("userId");
    window.localStorage.removeItem("userRole");
    window.localStorage.removeItem("userUnidadId");
    router.push("/");
  }

  function formatMoney(value) {
    return "$" + Number(value || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const unidad = data?.unidad;
  const expensas = data?.expensas || [];
  const pagos = data?.pagos || [];
  const deudaTotal = data?.deuda_total ?? 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .root { min-height: 100vh; background: #f4f6f9; font-family: 'Space Grotesk', sans-serif; }
        .topbar { background: #0f1f3d; color: #e2e8f0; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 1px; color: #93c5fd; }
        .logout { background: none; border: none; color: #93aed6; cursor: pointer; font-size: 13px; font-family: 'Space Grotesk', sans-serif; }
        .main { max-width: 900px; margin: 0 auto; padding: 32px 24px; display: grid; gap: 20px; }
        .tag { font-family: 'Space Mono', monospace; font-size: 10px; color: #2563eb; text-transform: uppercase; letter-spacing: 1.5px; }
        .title { margin: 4px 0 0; font-size: 26px; color: #0f1f3d; font-weight: 600; }
        .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 18px; }
        .card.accent { background: #1e3a8a; color: #fff; }
        .card-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #93aed6; text-transform: uppercase; letter-spacing: 1px; }
        .card.accent .card-label { color: #bfdbfe; }
        .card-value { font-size: 22px; font-weight: 600; margin-top: 6px; }
        .card-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .card.accent .card-sub { color: rgba(255,255,255,.6); }
        .section-title { font-family: 'Space Mono', monospace; color: #2563eb; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { font-family: 'Space Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; padding: 10px 8px; text-align: left; border-bottom: 1px solid rgba(37,99,235,.08); }
        td { padding: 11px 8px; border-bottom: 1px solid rgba(37,99,235,.06); font-size: 14px; color: #1e293b; }
        .money { font-family: 'Space Mono', monospace; color: #1e3a8a; font-weight: 700; }
        .empty { color: #94a3b8; text-align: center; padding: 24px; font-size: 13px; }
        .error-box { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; font-size: 13px; }
        .success-box { color: #15803d; background: #f0fdf4; border: 1px solid rgba(22,163,74,.2); padding: 12px 14px; border-radius: 8px; font-size: 13px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field-full { grid-column: 1 / -1; }
        label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #2563eb; }
        input, textarea { padding: 10px 12px; border: 1px solid rgba(37,99,235,.2); border-radius: 8px; background: #f8faff; font-size: 14px; font-family: 'Space Grotesk', sans-serif; color: #0f1f3d; outline: none; }
        input:focus, textarea:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.07); }
        textarea { resize: vertical; min-height: 60px; }
        .btn-submit { padding: 11px 24px; background: #1e40af; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-family: 'Space Grotesk', sans-serif; font-weight: 500; cursor: pointer; margin-top: 4px; transition: background .15s; }
        .btn-submit:hover:not(:disabled) { background: #1d3a9e; }
        .btn-submit:disabled { opacity: .6; cursor: not-allowed; }
        @media (max-width: 600px) { .grid2, .grid3, .form-grid { grid-template-columns: 1fr; } }

        /* pending state */
        .pending-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px; padding: 40px 24px; }
        .pending-icon { font-size: 40px; }
        .pending-title { font-size: 22px; font-weight: 600; color: #0f1f3d; margin: 0; }
        .pending-sub { font-size: 14px; color: #6b7a99; margin: 0; line-height: 1.7; max-width: 340px; }
        .pending-code-box { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 300px; }
        .pending-code {
          font-family: 'Space Mono', monospace; font-size: 32px; font-weight: 700;
          color: #1e40af; letter-spacing: 8px;
          background: #f0f4fb; border: 1px solid rgba(37,99,235,0.2); border-radius: 10px; padding: 20px;
        }
        .pending-copy {
          padding: 10px; background: #fff; color: #2563eb;
          border: 1px solid rgba(37,99,235,0.25); border-radius: 8px;
          font-size: 13px; font-family: 'Space Grotesk', sans-serif; font-weight: 500; cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .pending-copy:hover { background: rgba(37,99,235,0.04); border-color: #2563eb; }
        .pending-copy.copied { color: #15803d; border-color: rgba(22,163,74,.3); background: #f0fdf4; }
        .pending-note { font-size: 12px; color: #93aed6; font-family: 'Space Mono', monospace; }
      `}</style>

      <div className="root">
        <div className="topbar">
          <span className="logo">CONSORCIOS · Inquilino</span>
          <button className="logout" onClick={handleLogout}>cerrar sesión</button>
        </div>

        <main className="main">
          <div>
            <div className="tag">Mi cuenta</div>
            <h1 className="title">
              {unidad ? `Unidad ${unidad.piso}${unidad.apartamento}` : "Mi unidad"}
            </h1>
          </div>

          {error && <div className="error-box">{error}</div>}

          {isLoading ? (
            <div className="empty">Cargando...</div>
          ) : pendingCode ? (
            <div className="card">
              <div className="pending-wrap">
                <div className="pending-icon">⏳</div>
                <h2 className="pending-title">Cuenta pendiente de vinculación</h2>
                <p className="pending-sub">
                  Tu cuenta aún no está asignada a ninguna unidad.<br />
                  Compartí este código con el encargado de tu edificio.
                </p>
                <div className="pending-code-box">
                  <div className="pending-code">{pendingCode}</div>
                  <button
                    className={`pending-copy${codeCopied ? " copied" : ""}`}
                    onClick={handleCopyCode}
                  >
                    {codeCopied ? "¡Copiado!" : "Copiar código"}
                  </button>
                </div>
                <p className="pending-note">Una vez vinculado, cerrá sesión y volvé a entrar.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid3">
                <div className="card accent">
                  <div className="card-label">Deuda total</div>
                  <div className="card-value">{formatMoney(deudaTotal)}</div>
                  <div className="card-sub">Saldo pendiente</div>
                </div>
                <div className="card">
                  <div className="card-label">Expensas registradas</div>
                  <div className="card-value">{expensas.length}</div>
                  <div className="card-sub">Períodos liquidados</div>
                </div>
                <div className="card">
                  <div className="card-label">Pagos realizados</div>
                  <div className="card-value">{pagos.length}</div>
                  <div className="card-sub">Total de pagos</div>
                </div>
              </div>

              {/* Payment form */}
              <div className="card">
                <div className="section-title">Registrar un pago</div>
                {pagoError && <div className="error-box" style={{ marginBottom: 12 }}>{pagoError}</div>}
                {pagoSuccess && <div className="success-box" style={{ marginBottom: 12 }}>{pagoSuccess}</div>}
                <form onSubmit={handlePago}>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="fecha_pago">Fecha de pago</label>
                      <input
                        id="fecha_pago"
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="monto">Monto ($)</label>
                      <input
                        id="monto"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field field-full">
                      <label htmlFor="observacion">Observación (opcional)</label>
                      <textarea
                        id="observacion"
                        placeholder="Ej: Pago de expensa de marzo"
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Registrando..." : "Registrar pago"}
                  </button>
                </form>
              </div>

              {/* Per-period payment status */}
              <div className="card">
                <div className="section-title">Estado de expensas</div>
                {expensas.length === 0 ? (
                  <div className="empty">No hay expensas registradas.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Expensa</th>
                        <th>Pagado</th>
                        <th>Saldo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computePeriodos(expensas, pagos).map((p) => {
                        const cfg = {
                          saldado:  { label: "✓ Saldado",  bg: "rgba(22,163,74,.08)",   color: "#15803d", border: "rgba(22,163,74,.2)"  },
                          parcial:  { label: "⚠ Parcial",  bg: "rgba(234,179,8,.08)",   color: "#b45309", border: "rgba(234,179,8,.25)" },
                          pendiente:{ label: "✗ Pendiente",bg: "rgba(176,0,32,.08)",     color: "#b00020", border: "rgba(176,0,32,.2)"   },
                        }[p.estado];
                        return (
                          <tr key={p.id}>
                            <td style={{ fontFamily: "Space Mono,monospace", fontSize: 12 }}>
                              {String(p.mes).padStart(2, "0")}/{p.year}
                            </td>
                            <td className="money">{formatMoney(p.monto)}</td>
                            <td style={{ fontFamily: "Space Mono,monospace", fontSize: 12, color: "#15803d" }}>
                              {formatMoney(p.pagado)}
                            </td>
                            <td style={{ fontFamily: "Space Mono,monospace", fontSize: 12, color: p.saldo > 0 ? "#b00020" : "#64748b" }}>
                              {formatMoney(p.saldo)}
                            </td>
                            <td>
                              <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontFamily: "Space Mono,monospace", background: cfg.bg, color: cfg.color, border: `0.5px solid ${cfg.border}` }}>
                                {cfg.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Payment history */}
              <div className="card">
                <div className="section-title">Mis pagos</div>
                {pagos.length === 0 ? (
                  <div className="empty">No hay pagos registrados.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Período</th>
                        <th>Monto</th>
                        <th>Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((pago) => (
                        <tr key={pago.id}>
                          <td style={{ fontFamily: "Space Mono,monospace", fontSize: 12 }}>{pago.fecha_pago}</td>
                          <td style={{ fontFamily: "Space Mono,monospace", fontSize: 12, color: "#64748b" }}>
                            {String(pago.mes).padStart(2, "0")}/{pago.year}
                          </td>
                          <td className="money">{formatMoney(pago.monto)}</td>
                          <td style={{ color: "#64748b", fontSize: 13 }}>{pago.observacion || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
