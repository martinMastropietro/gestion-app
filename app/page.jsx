import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .land-root {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f4f6f9;
          background-image:
            linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          font-family: 'Space Grotesk', sans-serif;
          padding: 24px;
          position: relative;
        }

        /* corner marks */
        .land-corner {
          position: fixed;
          width: 16px; height: 16px;
          border-color: rgba(37,99,235,0.2);
          border-style: solid;
        }
        .land-corner-tl { top: 20px; left: 20px; border-width: 1px 0 0 1px; }
        .land-corner-tr { top: 20px; right: 20px; border-width: 1px 1px 0 0; }
        .land-corner-bl { bottom: 20px; left: 20px; border-width: 0 0 1px 1px; }
        .land-corner-br { bottom: 20px; right: 20px; border-width: 0 1px 1px 0; }

        .land-card {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 40px;
        }

        /* logo + name */
        .land-brand { display: flex; flex-direction: column; gap: 20px; }
        .land-logo-row { display: flex; align-items: center; gap: 12px; }
        .land-logo-icon {
          width: 36px; height: 36px;
          border: 2px solid #2563eb;
          border-radius: 6px;
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .land-logo-icon::before {
          content: '';
          width: 14px; height: 14px;
          border: 2px solid #2563eb;
          border-radius: 3px;
        }
        .land-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 13px; font-weight: 700;
          color: #1e3a8a; letter-spacing: 1px;
          text-transform: uppercase;
        }

        .land-headline {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .land-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 8px;
        }
        .land-tag::before { content: ''; width: 18px; height: 1px; background: #2563eb; }

        .land-title {
          font-size: 42px; font-weight: 600;
          color: #0f1f3d; line-height: 1.1;
          letter-spacing: -1px;
        }
        .land-title span { color: #2563eb; }

        .land-subtitle {
          font-size: 15px; color: #6b7a99;
          font-weight: 300; line-height: 1.6;
          max-width: 360px;
        }

        /* actions */
        .land-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }

        .land-btn-primary {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          background: #1e40af; color: #fff;
          border: none; border-radius: 10px;
          font-size: 15px; font-family: 'Space Grotesk', sans-serif;
          font-weight: 500; text-decoration: none;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .land-btn-primary:hover { background: #1d3a9e; transform: translateY(-1px); }

        .land-btn-arrow {
          width: 28px; height: 28px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .land-btn-arrow::after {
          content: '';
          width: 7px; height: 7px;
          border-right: 2px solid #fff;
          border-top: 2px solid #fff;
          transform: rotate(45deg) translate(-1px, 1px);
        }

        .land-divider {
          display: flex; align-items: center; gap: 12px;
        }
        .land-divider-line { flex: 1; height: 0.5px; background: rgba(37,99,235,0.12); }
        .land-divider-text {
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #b0bed6;
          letter-spacing: 1.5px; text-transform: uppercase;
        }

        .land-btn-secondary {
          display: flex; align-items: center; justify-content: center;
          padding: 13px 20px;
          background: #fff; color: #2563eb;
          border: 0.5px solid rgba(37,99,235,0.25);
          border-radius: 10px;
          font-size: 14px; font-family: 'Space Grotesk', sans-serif;
          font-weight: 500; text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .land-btn-secondary:hover { border-color: #2563eb; background: rgba(37,99,235,0.03); }

        /* footer */
        .land-footer {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #b0bed6;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="land-root">
        <div className="land-corner land-corner-tl" />
        <div className="land-corner land-corner-tr" />
        <div className="land-corner land-corner-bl" />
        <div className="land-corner land-corner-br" />

        <div className="land-card">
          <div className="land-brand">
            <div className="land-logo-row">
              <div className="land-logo-icon" />
              <span className="land-logo-text">Consorcios</span>
            </div>
            <div className="land-headline">
              <div className="land-tag">Sistema de gestión</div>
              <h1 className="land-title">
                Administrá<br />tu edificio<br /><span>sin vueltas.</span>
              </h1>
              <p className="land-subtitle">
                Unidades, gastos y expensas en un solo lugar.
              </p>
            </div>
          </div>

          <div className="land-actions">
            <Link href="/login" className="land-btn-primary">
              Empezar
              <div className="land-btn-arrow" />
            </Link>

            <div className="land-divider">
              <div className="land-divider-line" />
              <span className="land-divider-text">¿Primera vez?</span>
              <div className="land-divider-line" />
            </div>

            <Link href="/register" className="land-btn-secondary">
              Crear una cuenta
            </Link>
          </div>

          <div className="land-footer">© 2026 · SYS/MGT v2.1</div>
        </div>
      </div>
    </>
  );
}