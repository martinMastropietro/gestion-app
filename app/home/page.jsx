"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

// Role is read from localStorage once backend supports it.
// For now defaults to "admin". When backend returns a role on login,
// store it: localStorage.setItem("userRole", data.role)
// and this component will render accordingly.

const NAV_ITEMS = [
  {
    section: "Principal",
    items: [
      {
        label: "Overview",
        href: "/home",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        ),
      },
      {
        label: "Residentes",
        href: "/unidades",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        ),
      },
      {
        label: "Gastos Comunes",
        href: "/gastos",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: "Gestión",
    items: [
      {
        label: "Morosos",
        href: "/morosos",
        badge: true,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ),
      },
      {
        label: "Expensas",
        href: "/expensas",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3"/>
            <path d="M9 15h3l8.5-8.5a1.5 1.5 0 00-3-3L9 12v3z"/>
          </svg>
        ),
      },
      {
        label: "Herramientas",
        href: "/herramientas",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
          </svg>
        ),
      },
    ],
  },
];

// Placeholder morosos data — replace with API call when endpoint is ready
const MOROSOS = [
  { unidad: "1B", propietario: "Ramón Valdes", meses: 14, deuda: "$1.080.000", estado: "Acción legal", estadoType: "red" },
  { unidad: "4D", propietario: "Armando Casas", meses: 6, deuda: "$678.000", estado: "Crítico", estadoType: "amber" },
  { unidad: "12A", propietario: "Elena Nito", meses: 4, deuda: "$450.650", estado: "Crítico", estadoType: "amber" },
  { unidad: "8C", propietario: "Olimpia Olavoto", meses: 1, deuda: "$107.000", estado: "Aviso enviado", estadoType: "blue" },
];

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalGastos, setTotalGastos] = useState(null);
  const [totalResidentes, setTotalResidentes] = useState(null);
  // role: "admin" | "inquilino" — swap source to localStorage when backend supports it
  const role = typeof window !== "undefined" ? (window.localStorage.getItem("userRole") || "admin") : "admin";

  useEffect(() => {
    const userId = window.localStorage.getItem("userId");
    if (!userId) { router.push("/login"); return; }

    apiRequest(`/user/${userId}`)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setIsLoading(false));

    // Fetch gastos and sum all montos
    apiRequest("/api/gastos/")
      .then((data) => {
        if (Array.isArray(data)) {
          const suma = data.reduce((acc, g) => acc + Number(g.monto || 0), 0);
          setTotalGastos(suma);
        }
      })
      .catch(() => setTotalGastos(null));

    // Fetch unidades and count
    apiRequest("/api/unidades/")
      .then((data) => {
        if (Array.isArray(data)) setTotalResidentes(data.length);
      })
      .catch(() => setTotalResidentes(null));
  }, [router]);

  function formatMoney(val) {
    if (val === null) return "...";
    return "$" + Number(val).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function handleLogout() {
    window.localStorage.removeItem("userId");
    window.localStorage.removeItem("userRole");
    router.push("/");
  }

  if (role === "inquilino") return <TenantView profile={profile} onLogout={handleLogout} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .hp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Space Grotesk', sans-serif;
          background: #f4f6f9;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          background: #0f1f3d;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width 0.22s ease;
          overflow: hidden;
          position: relative;
          z-index: 20;
        }
        .sidebar.open  { width: 220px; }
        .sidebar.closed { width: 56px; }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 16px 20px;
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
          white-space: nowrap;
          overflow: hidden;
        }
        .sidebar-logo-icon {
          width: 24px; height: 24px;
          border: 1.5px solid #3b82f6;
          border-radius: 4px;
          display: grid; place-items: center;
          flex-shrink: 0; cursor: pointer;
        }
        .sidebar-logo-icon::before {
          content: '';
          width: 8px; height: 8px;
          border: 1.5px solid #3b82f6;
          border-radius: 2px;
        }
        .sidebar-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 11px; font-weight: 700;
          color: #e2e8f0; letter-spacing: 0.5px;
          opacity: 1; transition: opacity 0.15s;
        }
        .sidebar.closed .sidebar-logo-text { opacity: 0; pointer-events: none; }

        .sidebar-toggle {
          background: none; border: none;
          padding: 12px 16px 4px;
          cursor: pointer;
          display: flex;
          justify-content: flex-end;
        }
        .sidebar-toggle svg {
          width: 14px; height: 14px;
          stroke: #334d7a; fill: none;
          stroke-width: 2; stroke-linecap: round;
          transition: transform 0.22s;
        }
        .sidebar.closed .sidebar-toggle svg { transform: rotate(180deg); }

        .sidebar-section {
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #334d7a;
          letter-spacing: 2px; text-transform: uppercase;
          padding: 16px 18px 6px;
          white-space: nowrap; overflow: hidden;
          opacity: 1; transition: opacity 0.15s;
        }
        .sidebar.closed .sidebar-section { opacity: 0; }

        .sidebar-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 18px;
          font-size: 12px; color: #94a3c0;
          cursor: pointer;
          border-left: 2px solid transparent;
          text-decoration: none;
          white-space: nowrap; overflow: hidden;
          transition: color 0.15s, background 0.15s, border-color 0.15s, padding 0.22s;
          position: relative;
        }
        .sidebar-item:hover { color: #e2e8f0; background: rgba(59,130,246,0.06); }
        .sidebar-item.active { color: #e2e8f0; background: rgba(59,130,246,0.1); border-left-color: #3b82f6; }

        /* collapsed: center icon */
        .sidebar.closed .sidebar-item {
          padding: 10px 0;
          justify-content: center;
          gap: 0;
        }

        .sidebar-item-label { opacity: 1; transition: opacity 0.15s; }
        .sidebar.closed .sidebar-item-label { opacity: 0; width: 0; overflow: hidden; }

        /* tooltip shown on hover when collapsed */
        .sidebar-tooltip {
          position: absolute;
          left: calc(100% + 10px);
          top: 50%; transform: translateY(-50%);
          background: #1e3a8a;
          color: #e2e8f0;
          font-family: 'Space Mono', monospace;
          font-size: 10px; letter-spacing: 0.5px;
          padding: 5px 10px; border-radius: 6px;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 0.15s;
          border: 0.5px solid rgba(59,130,246,0.3);
          z-index: 50;
        }
        .sidebar-tooltip::before {
          content: '';
          position: absolute;
          right: 100%; top: 50%; transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1e3a8a;
        }
        .sidebar.closed .sidebar-item:hover .sidebar-tooltip { opacity: 1; }

        .sidebar-badge {
          margin-left: auto;
          background: rgba(239,68,68,0.15);
          color: #f87171;
          font-family: 'Space Mono', monospace;
          font-size: 9px; padding: 2px 6px;
          border-radius: 4px;
          opacity: 1; transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .sidebar.closed .sidebar-badge { opacity: 0; width: 0; padding: 0; margin: 0; overflow: hidden; }

        /* red dot when collapsed + badge */
        .sidebar.closed .sidebar-item.has-badge::after {
          content: '';
          position: absolute;
          top: 8px; right: 8px;
          width: 6px; height: 6px;
          background: #f87171; border-radius: 50%;
          border: 1.5px solid #0f1f3d;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 16px 18px;
          border-top: 0.5px solid rgba(255,255,255,0.06);
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-user {
          font-size: 11px; color: #94a3c0;
          display: flex; flex-direction: column; gap: 2px;
          opacity: 1; transition: opacity 0.15s;
        }
        .sidebar.closed .sidebar-user { opacity: 0; }
        .sidebar-user strong { font-size: 12px; color: #e2e8f0; font-weight: 500; }
        .sidebar-logout {
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #334d7a;
          letter-spacing: 0.5px; margin-top: 10px;
          cursor: pointer; background: none; border: none;
          text-align: left; padding: 0;
          opacity: 1; transition: opacity 0.15s;
        }
        .sidebar.closed .sidebar-logout { opacity: 0; }
        .sidebar-logout:hover { color: #94a3c0; }

        /* ── MAIN ── */
        .hp-main {
          flex: 1;
          padding: 28px 32px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .hp-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .hp-page-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .hp-page-tag::before { content: ''; width: 14px; height: 1px; background: #2563eb; }
        .hp-status {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #93aed6;
        }
        .status-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }

        /* ── METRIC CARDS ── */
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

        .metric-card {
          background: #fff;
          border: 0.5px solid rgba(37,99,235,0.12);
          border-radius: 10px; padding: 16px 18px;
          display: flex; flex-direction: column; gap: 8px;
          text-decoration: none;
          transition: border-color 0.15s, transform 0.12s;
          cursor: pointer;
        }
        .metric-card:hover { border-color: rgba(37,99,235,0.35); transform: translateY(-1px); }
        .metric-card.accent { background: #1e3a8a; border-color: #1e3a8a; }
        .metric-card.accent:hover { border-color: #2952c4; }

        .metric-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .metric-icon {
          width: 28px; height: 28px; border-radius: 6px;
          display: grid; place-items: center;
          background: rgba(37,99,235,0.08);
          border: 0.5px solid rgba(37,99,235,0.15);
        }
        .metric-icon.white { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.15); }
        .metric-icon svg { width: 14px; height: 14px; stroke: #2563eb; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .metric-icon.white svg { stroke: #93c5fd; }
        .metric-arrow { font-size: 12px; color: #93aed6; }
        .metric-arrow.white { color: rgba(255,255,255,0.3); }
        .metric-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px; letter-spacing: 1px;
          text-transform: uppercase; color: #93aed6;
        }
        .metric-label.white { color: #93c5fd; }
        .metric-sublabel { font-size: 10px; color: #b0bed6; margin-top: 1px; }
        .metric-sublabel.white { color: rgba(255,255,255,0.4); }
        .metric-val { font-size: 20px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.5px; }
        .metric-val.white { color: #fff; }

        /* ── BOTTOM ── */
        .bottom-section { display: flex; flex-direction: column; gap: 8px; }
        .section-tag {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #2563eb;
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .section-tag::before { content: ''; width: 14px; height: 1px; background: #2563eb; }

        .table-card {
          background: #fff;
          border: 0.5px solid rgba(37,99,235,0.12);
          border-radius: 10px; padding: 18px 20px;
          overflow-x: auto;
        }
        .mini-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .mini-table th {
          text-align: left;
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #b0bed6;
          letter-spacing: 1px; text-transform: uppercase;
          padding: 0 12px 10px 0; font-weight: 400;
        }
        .mini-table td {
          padding: 9px 12px 9px 0;
          border-top: 0.5px solid rgba(37,99,235,0.06);
          color: #0f1f3d; vertical-align: middle;
        }
        .badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px; padding: 3px 8px;
          border-radius: 4px; letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .badge-red   { background: rgba(239,68,68,0.1);  color: #dc2626; }
        .badge-amber { background: rgba(245,158,11,0.1); color: #d97706; }
        .badge-blue  { background: rgba(37,99,235,0.08); color: #2563eb; }
      `}</style>

      <div className="hp-root">
        {/* ── SIDEBAR ── */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-logo" onClick={() => setSidebarOpen(o => !o)} style={{ cursor: "pointer" }}>
            <div className="sidebar-logo-icon" />
            <span className="sidebar-logo-text">CONSORCIOS</span>
          </div>

          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              <div className="sidebar-section">{group.section}</div>
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`sidebar-item${item.href === "/home" ? " active" : ""}${item.badge ? " has-badge" : ""}`}
                >
                  {item.icon}
                  <span className="sidebar-item-label">{item.label}</span>
                  {item.badge && <span className="sidebar-badge">4</span>}
                  <span className="sidebar-tooltip">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span>Sesión activa</span>
              <strong>{isLoading ? "..." : (profile?.user ?? "admin")}</strong>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              // cerrar sesión
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="hp-main">
          <div className="hp-topbar">
            <div className="hp-page-tag">Overview</div>
            <div className="hp-status">
              <div className="status-dot" />
              SYS/MGT · v2.1
            </div>
          </div>

          {/* METRIC CARDS */}
          <div className="metrics-grid">
            <Link href="/gastos" className="metric-card accent" style={{ textDecoration: "none" }}>
              <div className="metric-top">
                <div className="metric-icon white">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <span className="metric-arrow white">→</span>
              </div>
              <div>
                <div className="metric-label white">Gastos comunes</div>
                <div className="metric-sublabel white">Suma total</div>
              </div>
              <div className="metric-val white">{formatMoney(totalGastos)}</div>
            </Link>

            <Link href="/unidades" className="metric-card" style={{ textDecoration: "none" }}>
              <div className="metric-top">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <span className="metric-arrow">→</span>
              </div>
              <div>
                <div className="metric-label">Residentes</div>
                <div className="metric-sublabel">Unidades registradas</div>
              </div>
              <div className="metric-val">{totalResidentes === null ? "..." : totalResidentes}</div>
            </Link>

            <Link href="/morosos" className="metric-card" style={{ textDecoration: "none" }}>
              <div className="metric-top">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <span className="metric-arrow">→</span>
              </div>
              <div>
                <div className="metric-label">Total deuda</div>
                <div className="metric-sublabel">Monto adeudado</div>
              </div>
              <div className="metric-val">$5.000.000</div>
            </Link>

            {/* CAJA CHICA — replace hardcoded values with API data when available */}
            <div className="metric-card" style={{ cursor: "default" }}>
              <div className="metric-top">
                <div className="metric-icon">
                  <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                </div>
              </div>
              <div>
                <div className="metric-label">Caja chica</div>
                <div className="metric-sublabel">Saldo disponible</div>
              </div>
              <div className="metric-val">$320.000</div>
            </div>
          </div>

          {/* MOROSOS TABLE */}
          <div className="bottom-section">
            <div className="section-tag">Morosos críticos</div>
            <div className="table-card">
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Unidad</th>
                    <th>Propietario</th>
                    <th>Meses adeudados</th>
                    <th>Deuda total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOROSOS.map((m) => (
                    <tr key={m.unidad}>
                      <td>{m.unidad}</td>
                      <td>{m.propietario}</td>
                      <td>{m.meses}</td>
                      <td>{m.deuda}</td>
                      <td>
                        <span className={`badge badge-${m.estadoType}`}>{m.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   TENANT VIEW
   Shown when localStorage.userRole === "inquilino"
   ───────────────────────────────────────────── */
function TenantView({ profile, onLogout }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tv-root {
          min-height: 100vh;
          background: #f4f6f9;
          background-image:
            linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
          font-family: 'Space Grotesk', sans-serif;
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tv-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tv-logo { display: flex; align-items: center; gap: 10px; }
        .tv-logo-icon {
          width: 26px; height: 26px;
          border: 1.5px solid #2563eb; border-radius: 4px;
          display: grid; place-items: center;
        }
        .tv-logo-icon::before {
          content: ''; width: 9px; height: 9px;
          border: 1.5px solid #2563eb; border-radius: 2px;
        }
        .tv-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 12px; font-weight: 700;
          color: #1e3a8a; letter-spacing: 0.5px;
        }
        .tv-user { display: flex; align-items: center; gap: 10px; }
        .tv-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(37,99,235,0.1);
          border: 0.5px solid rgba(37,99,235,0.2);
          display: grid; place-items: center;
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #2563eb; font-weight: 700;
        }
        .tv-username { font-size: 13px; color: #6b7a99; }
        .tv-logout {
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #93aed6;
          letter-spacing: 0.5px; cursor: pointer;
          background: none; border: none;
        }
        .tv-logout:hover { color: #6b7a99; }

        .tv-greeting-sub {
          font-family: 'Space Mono', monospace;
          font-size: 10px; color: #93aed6;
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;
        }
        .tv-greeting-name { font-size: 20px; font-weight: 600; color: #0f1f3d; letter-spacing: -0.3px; }

        .tv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .tv-card {
          background: #fff;
          border: 0.5px solid rgba(37,99,235,0.12);
          border-radius: 10px; padding: 20px;
        }
        .tv-card.accent { background: #1e3a8a; border-color: #1e3a8a; }
        .tv-card.full { grid-column: 1 / -1; }

        .tv-debt-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #93c5fd;
          letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;
        }
        .tv-debt-val { font-size: 28px; font-weight: 600; color: #fff; letter-spacing: -0.5px; }
        .tv-debt-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 6px; }

        .tv-card-title {
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #2563eb;
          letter-spacing: 1.5px; text-transform: uppercase;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 6px;
        }
        .tv-card-title::before { content: ''; width: 10px; height: 1px; background: #2563eb; }

        .upload-area {
          border: 1px dashed rgba(37,99,235,0.25);
          border-radius: 8px; padding: 18px;
          display: flex; flex-direction: column;
          align-items: center; gap: 8px; background: #f8faff;
        }
        .upload-icon {
          width: 30px; height: 30px;
          background: rgba(37,99,235,0.08); border-radius: 6px;
          display: grid; place-items: center;
        }
        .upload-icon svg { width: 14px; height: 14px; stroke: #2563eb; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .upload-text { font-size: 11px; color: #6b7a99; text-align: center; line-height: 1.5; }
        .upload-text strong { color: #2563eb; font-weight: 500; }
        .upload-btn {
          width: 100%; padding: 10px;
          background: #1e40af; color: #fff;
          border: none; border-radius: 8px;
          font-size: 12px; font-family: 'Space Grotesk', sans-serif;
          font-weight: 500; cursor: pointer; margin-top: 6px;
          transition: background 0.15s;
        }
        .upload-btn:hover { background: #1d3a9e; }

        .history-row {
          display: flex; justify-content: space-between;
          align-items: center; padding: 9px 0;
          border-top: 0.5px solid rgba(37,99,235,0.06);
          font-size: 12px;
        }
        .history-row:first-of-type { border-top: none; }
        .history-date {
          font-family: 'Space Mono', monospace;
          font-size: 9px; color: #6b7a99; letter-spacing: 0.5px;
        }
        .history-amount { color: #0f1f3d; font-weight: 500; }
        .tv-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px; padding: 3px 8px;
          border-radius: 4px; letter-spacing: 0.5px;
        }
        .tv-badge-blue  { background: rgba(37,99,235,0.08); color: #2563eb; }
        .tv-badge-amber { background: rgba(245,158,11,0.1); color: #d97706; }
      `}</style>

      <div className="tv-root">
        <div className="tv-topbar">
          <div className="tv-logo">
            <div className="tv-logo-icon" />
            <span className="tv-logo-text">CONSORCIOS</span>
          </div>
          <div className="tv-user">
            <div className="tv-avatar">
              {profile?.user?.slice(0, 2).toUpperCase() ?? "U"}
            </div>
            <span className="tv-username">{profile?.user ?? "..."}</span>
            <button className="tv-logout" onClick={onLogout}>// salir</button>
          </div>
        </div>

        <div>
          <div className="tv-greeting-sub">Panel del residente</div>
          <div className="tv-greeting-name">Unidad 4B · Piso 4</div>
        </div>

        <div className="tv-grid">
          <div className="tv-card accent">
            <div className="tv-debt-label">Deuda pendiente</div>
            <div className="tv-debt-val">$678.000</div>
            <div className="tv-debt-sub">Vencimiento: 30 abr 2026</div>
          </div>

          <div className="tv-card">
            <div className="tv-card-title">Notificar pago</div>
            <div className="upload-area">
              <div className="upload-icon">
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div className="upload-text">
                <strong>Adjuntá el comprobante</strong><br />PDF o imagen
              </div>
            </div>
            <button className="upload-btn">Enviar notificación</button>
          </div>

          <div className="tv-card full">
            <div className="tv-card-title">Historial de pagos</div>
            <div className="history-row">
              <span className="history-date">MAR 2026</span>
              <span className="history-amount">$161.500</span>
              <span className="tv-badge tv-badge-blue">Abonado</span>
            </div>
            <div className="history-row">
              <span className="history-date">FEB 2026</span>
              <span className="history-amount">$158.000</span>
              <span className="tv-badge tv-badge-blue">Abonado</span>
            </div>
            <div className="history-row">
              <span className="history-date">ENE 2026</span>
              <span className="history-amount">$155.200</span>
              <span className="tv-badge tv-badge-amber">Pendiente</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}