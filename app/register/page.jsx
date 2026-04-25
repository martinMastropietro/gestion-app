"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await apiRequest("/users/create", {
        method: "POST",
        body: JSON.stringify({ user, password }),
      });
      router.push("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .bp-root {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #f4f6f9;
          font-family: 'Space Grotesk', sans-serif;
          background-image:
            linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .bp-card {
          width: 100%;
          max-width: 860px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: 12px;
          border: 0.5px solid rgba(37,99,235,0.15);
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 24px rgba(37,99,235,0.06);
        }

        @media (max-width: 600px) {
          .bp-card { grid-template-columns: 1fr; }
          .bp-left { display: none; }
        }

        .bp-corner {
          position: absolute;
          width: 12px; height: 12px;
          border-color: rgba(37,99,235,0.25);
          border-style: solid;
          z-index: 2;
        }
        .bp-corner-tl { top: 12px; left: 12px; border-width: 1px 0 0 1px; }
        .bp-corner-tr { top: 12px; right: 12px; border-width: 1px 1px 0 0; }
        .bp-corner-bl { bottom: 12px; left: 12px; border-width: 0 0 1px 1px; }
        .bp-corner-br { bottom: 12px; right: 12px; border-width: 0 1px 1px 0; }

        .bp-left {
          background: #f0f4fb;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 0.5px solid rgba(37,99,235,0.12);
        }

        .bp-logo-line { display: flex; align-items: center; gap: 10px; }
        .bp-logo-icon {
          width: 28px; height: 28px;
          border: 1.5px solid #2563eb;
          border-radius: 4px;
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .bp-logo-icon::before {
          content: '';
          width: 10px; height: 10px;
          border: 1.5px solid #2563eb;
          border-radius: 2px;
        }
        .bp-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 13px; font-weight: 700;
          color: #1e3a8a; letter-spacing: 0.5px;
        }
        .bp-version {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #93aed6;
          letter-spacing: 1px; margin-top: 4px; margin-left: 38px;
        }

        .bp-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 12px;
        }
        .bp-tag::before { content: ''; width: 16px; height: 1px; background: #2563eb; }

        .bp-steps { display: grid; gap: 14px; }
        .bp-step { display: flex; align-items: flex-start; gap: 12px; }
        .step-num {
          font-family: 'Space Mono', monospace; font-size: 10px;
          color: #2563eb;
          background: rgba(37,99,235,0.08);
          border: 0.5px solid rgba(37,99,235,0.2);
          border-radius: 4px; padding: 3px 7px;
          flex-shrink: 0; margin-top: 1px;
        }
        .step-text { font-size: 13px; color: #6b7a99; line-height: 1.5; }
        .step-text strong { display: block; color: #0f1f3d; font-weight: 500; margin-bottom: 1px; }

        .bp-right {
          background: #fff;
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .bp-form-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #93aed6;
          letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 20px;
        }
        .bp-form-title {
          font-size: 22px; font-weight: 600;
          color: #0f1f3d; margin: 0 0 4px;
          letter-spacing: -0.3px;
        }
        .bp-form-sub {
          font-size: 13px; color: #6b7a99;
          margin: 0 0 32px; font-weight: 300;
        }

        .bp-field { margin-bottom: 18px; }
        .bp-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px; letter-spacing: 1.5px;
          text-transform: uppercase; color: #2563eb;
          display: block; margin-bottom: 7px;
        }
        .bp-input {
          width: 100%; padding: 11px 14px;
          border: 1px solid rgba(37,99,235,0.2);
          border-radius: 8px; background: #f8faff;
          color: #0f1f3d; font-size: 14px;
          font-family: 'Space Grotesk', sans-serif;
          box-sizing: border-box; outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .bp-input:focus {
          border-color: #2563eb; background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .bp-input::placeholder { color: #b0bed6; }

        .bp-error {
          font-size: 12px; color: #b00020;
          background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.2);
          border-radius: 8px; padding: 10px 12px;
          margin-bottom: 16px;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.3px;
        }

        .bp-btn {
          width: 100%; padding: 12px;
          background: #1e40af; color: #fff;
          border: none; border-radius: 8px;
          font-size: 14px; font-family: 'Space Grotesk', sans-serif;
          font-weight: 500; cursor: pointer; margin-top: 8px;
          letter-spacing: 0.2px;
          transition: background 0.15s;
          display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .bp-btn:hover:not(:disabled) { background: #1d3a9e; }
        .bp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .bp-btn-arrow {
          width: 16px; height: 16px;
          border: 1.5px solid rgba(255,255,255,0.5);
          border-radius: 50%;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .bp-btn-arrow::after {
          content: '';
          width: 5px; height: 5px;
          border-right: 1.5px solid #fff;
          border-top: 1.5px solid #fff;
          transform: rotate(45deg) translate(-1px, 1px);
        }

        .bp-divider { height: 0.5px; background: rgba(37,99,235,0.1); margin: 20px 0; }
        .bp-register { text-align: center; font-size: 12px; color: #93aed6; }
        .bp-register a { color: #2563eb; text-decoration: none; font-weight: 500; }
        .bp-register a:hover { text-decoration: underline; }
      `}</style>

      <main className="bp-root">
        <div className="bp-card">
          <div className="bp-corner bp-corner-tl" />
          <div className="bp-corner bp-corner-tr" />
          <div className="bp-corner bp-corner-bl" />
          <div className="bp-corner bp-corner-br" />

          <div className="bp-left">
            <div>
              <div className="bp-logo-line">
                <div className="bp-logo-icon" />
                <span className="bp-logo-text">CONSORCIOS</span>
              </div>
              <div className="bp-version">v2.1 · SYS/MGT</div>
            </div>

            <div>
              <div className="bp-tag">Nuevo usuario</div>
              <div className="bp-steps">
                <div className="bp-step">
                  <span className="step-num">01</span>
                  <div className="step-text">
                    <strong>Creá tu cuenta</strong>
                    Elegí un usuario y contraseña.
                  </div>
                </div>
                <div className="bp-step">
                  <span className="step-num">02</span>
                  <div className="step-text">
                    <strong>Accedé al sistema</strong>
                    
                  </div>
                </div>
                <div className="bp-step">
                  <span className="step-num">03</span>
                  <div className="step-text">
                    <strong>Gestioná automáticamente</strong>
                    Tus expensas.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#93aed6", fontFamily: "'Space Mono', monospace" }}>
              © 2026 · Gestión de consorcios
            </div>
          </div>

          <div className="bp-right">
            <div className="bp-form-tag">// nuevo acceso</div>
            <h1 className="bp-form-title">Crear cuenta</h1>
            <p className="bp-form-sub">Completá los datos para registrarte.</p>

            {error && <div className="bp-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="bp-field">
                <label className="bp-label" htmlFor="user">Usuario</label>
                <input
                  id="user"
                  className="bp-input"
                  type="text"
                  placeholder="tu.usuario"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  required
                />
              </div>
              <div className="bp-field">
                <label className="bp-label" htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  className="bp-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="bp-btn" disabled={isSubmitting}>
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                {!isSubmitting && <div className="bp-btn-arrow" />}
              </button>
            </form>

            <div className="bp-divider" />
            <div className="bp-register">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login">Iniciá sesión</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}