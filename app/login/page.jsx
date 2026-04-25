"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
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
      const data = await apiRequest("/users/login", {
        method: "POST",
        body: JSON.stringify({ user, password }),
      });
      window.localStorage.setItem("userId", data.id);
      router.push("/home");
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
          width: 12px;
          height: 12px;
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

        .bp-logo-line {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bp-logo-icon {
          width: 28px;
          height: 28px;
          border: 1.5px solid #2563eb;
          border-radius: 4px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .bp-logo-icon::before {
          content: '';
          width: 10px;
          height: 10px;
          border: 1.5px solid #2563eb;
          border-radius: 2px;
        }
        .bp-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          color: #1e3a8a;
          letter-spacing: 0.5px;
        }
        .bp-version {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #93aed6;
          letter-spacing: 1px;
          margin-top: 4px;
          margin-left: 38px;
        }

        .bp-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #2563eb;
          letter-spacing: 2px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
        }
        .bp-tag::before {
          content: '';
          width: 16px;
          height: 1px;
          background: #2563eb;
        }
        .bp-h1 {
          font-size: 28px;
          font-weight: 600;
          color: #0f1f3d;
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin: 0 0 12px;
        }
        .bp-h1 span { color: #2563eb; }
        .bp-desc {
          font-size: 13px;
          color: #6b7a99;
          font-weight: 300;
          line-height: 1.6;
          margin: 0;
        }

        .bp-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .bp-stat {
          background: rgba(255,255,255,0.8);
          border: 0.5px solid rgba(37,99,235,0.15);
          border-radius: 8px;
          padding: 10px 12px;
        }
        .bp-stat-val {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          color: #0f1f3d;
        }
        .bp-stat-label {
          font-size: 10px;
          color: #93aed6;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .bp-right {
          background: #ffffff;
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .bp-form-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #93aed6;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .bp-form-title {
          font-size: 22px;
          font-weight: 600;
          color: #0f1f3d;
          margin: 0 0 4px;
          letter-spacing: -0.3px;
        }
        .bp-form-sub {
          font-size: 13px;
          color: #6b7a99;
          margin: 0 0 32px;
          font-weight: 300;
        }

        .bp-field { margin-bottom: 18px; }
        .bp-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #2563eb;
          display: block;
          margin-bottom: 7px;
        }
        .bp-input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid rgba(37,99,235,0.2);
          border-radius: 8px;
          background: #f8faff;
          color: #0f1f3d;
          font-size: 14px;
          font-family: 'Space Grotesk', sans-serif;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .bp-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        }
        .bp-input::placeholder { color: #b0bed6; }

        .bp-error {
          font-size: 12px;
          color: #b00020;
          background: #fff0f2;
          border: 0.5px solid rgba(176,0,32,0.2);
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 16px;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.3px;
        }

        .bp-btn {
          width: 100%;
          padding: 12px;
          background: #1e40af;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 500;
          cursor: pointer;
          margin-top: 8px;
          letter-spacing: 0.2px;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .bp-btn:hover:not(:disabled) { background: #1d3a9e; }
        .bp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .bp-btn-arrow {
          width: 16px;
          height: 16px;
          border: 1.5px solid rgba(255,255,255,0.5);
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .bp-btn-arrow::after {
          content: '';
          width: 5px;
          height: 5px;
          border-right: 1.5px solid #fff;
          border-top: 1.5px solid #fff;
          transform: rotate(45deg) translate(-1px, 1px);
        }

        .bp-divider {
          height: 0.5px;
          background: rgba(37,99,235,0.1);
          margin: 20px 0;
        }
        .bp-register {
          text-align: center;
          font-size: 12px;
          color: #93aed6;
        }
        .bp-register a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
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
              <div className="bp-tag">Sistema activo</div>
              <h1 className="bp-h1">Gestión<br /><span>inteligente</span><br />de edificios.</h1>
              <p className="bp-desc">Unidades, gastos y expensas en un solo lugar.</p>
            </div>

            <div className="bp-stats">
              <div className="bp-stat">
                <div className="bp-stat-val">∑</div>
                <div className="bp-stat-label">Expensas</div>
              </div>
              <div className="bp-stat">
                <div className="bp-stat-val">⌂</div>
                <div className="bp-stat-label">Unidades</div>
              </div>
            </div>
          </div>

          <div className="bp-right">
            <div className="bp-form-tag">// acceso al sistema</div>
            <h2 className="bp-form-title">Iniciar sesión</h2>
            <p className="bp-form-sub">Ingresá tus credenciales para continuar.</p>

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
                {isSubmitting ? "Ingresando..." : "Ingresar"}
                {!isSubmitting && <div className="bp-btn-arrow" />}
              </button>
            </form>

            <div className="bp-divider" />
            <div className="bp-register">
              ¿No tenés cuenta?{" "}
              <Link href="/register">Registrate aquí</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}