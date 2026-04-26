"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

const NAV_ITEMS = [
  { label: "Overview", href: "/home" },
  { label: "Residentes", href: "/unidades" },
  { label: "Gastos", href: "/gastos" },
  { label: "Expensas", href: "/expensas" },
  { label: "Pagos", href: "/pagos" },
  { label: "Morosos", href: "/morosos" },
];

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [morosos, setMorosos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = window.localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }

    async function loadOverview() {
      try {
        const profileData = await apiRequest(`/user/${userId}`);
        setProfile(profileData);

        const summaryData = await apiRequest("/api/overview/resumen");
        setSummary(summaryData);

        const morososData = await apiRequest("/api/overview/morosos");
        setMorosos(morososData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadOverview();
  }, [router]);

  function handleLogout() {
    window.localStorage.removeItem("userId");
    window.localStorage.removeItem("userRole");
    router.push("/");
  }

  function formatMoney(value) {
    return "$" + Number(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .root { min-height: 100vh; display: grid; grid-template-columns: 220px 1fr; background: #f4f6f9; font-family: 'Space Grotesk', sans-serif; }
        .sidebar { background: #0f1f3d; color: #e2e8f0; padding: 24px 16px; display: flex; flex-direction: column; gap: 10px; }
        .logo { font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 1px; color: #93c5fd; margin-bottom: 10px; }
        .nav-link { color: #94a3c0; text-decoration: none; padding: 10px 12px; border-radius: 8px; }
        .nav-link:hover, .nav-link.active { background: rgba(59,130,246,.12); color: #fff; }
        .logout { margin-top: auto; background: none; border: none; color: #93aed6; text-align: left; cursor: pointer; }
        .main { padding: 28px 32px; display: grid; gap: 20px; }
        .topbar { display: flex; justify-content: space-between; align-items: center; }
        .tag, .label, th { font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
        .tag { font-size: 10px; color: #2563eb; }
        .title { margin: 6px 0 0; font-size: 28px; color: #0f1f3d; }
        .status { color: #64748b; }
        .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .card { background: #fff; border: 1px solid rgba(37,99,235,.12); border-radius: 12px; padding: 18px; }
        .card.accent { background: #1e3a8a; color: #fff; }
        .label { font-size: 10px; color: #93aed6; }
        .card.accent .label { color: #bfdbfe; }
        .value { font-size: 24px; font-weight: 600; margin-top: 6px; }
        .sublabel { color: #94a3b8; margin-top: 6px; font-size: 13px; }
        .card.accent .sublabel { color: rgba(255,255,255,.65); }
        .section-title { font-family: 'Space Mono', monospace; color: #2563eb; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid rgba(37,99,235,.08); }
        th { font-size: 10px; color: #94a3b8; }
        .money { font-family: 'Space Mono', monospace; color: #1e3a8a; font-weight: 700; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(37,99,235,.08); color: #1e3a8a; font-family: 'Space Mono', monospace; }
        .error { color: #b00020; background: #fff0f2; border: 1px solid rgba(176,0,32,.15); padding: 12px 14px; border-radius: 8px; }
        .empty { color: #94a3b8; text-align: center; padding: 28px; }
        @media (max-width: 980px) { .root { grid-template-columns: 1fr; } .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="root">
        <aside className="sidebar">
          <div className="logo">CONSORCIOS</div>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link${item.href === "/home" ? " active" : ""}`}>
              {item.label}
            </Link>
          ))}
          <div style={{ marginTop: 16, color: "#94a3c0", fontSize: 12 }}>
            Sesión activa
            <div style={{ color: "#fff", marginTop: 4 }}>{isLoading ? "..." : profile?.user || "-"}</div>
          </div>
          <button className="logout" onClick={handleLogout}>cerrar sesión</button>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <div className="tag">Overview</div>
              <h1 className="title">Panel general</h1>
            </div>
            <div className="status">{isLoading ? "Cargando..." : "Operativo"}</div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="grid">
            <div className="card accent">
              <div className="label">Gastos comunes</div>
              <div className="value">{formatMoney(summary?.total_gastos)}</div>
              <div className="sublabel">Suma acumulada registrada</div>
            </div>
            <div className="card">
              <div className="label">Residentes</div>
              <div className="value">{summary?.total_unidades ?? 0}</div>
              <div className="sublabel">Unidades registradas</div>
            </div>
            <div className="card">
              <div className="label">Deuda total</div>
              <div className="value">{formatMoney(summary?.deuda_total)}</div>
              <div className="sublabel">Calculada a hoy</div>
            </div>
            <div className="card">
              <div className="label">Morosos</div>
              <div className="value">{morosos.length}</div>
              <div className="sublabel">Unidades con deuda positiva</div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Morosos críticos</div>
            {morosos.length === 0 ? (
              <div className="empty">No hay unidades con deuda pendiente.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Unidad</th>
                    <th>Propietario</th>
                    <th>Deuda total</th>
                  </tr>
                </thead>
                <tbody>
                  {morosos.map((moroso) => (
                    <tr key={moroso.unidad_id}>
                      <td><span className="badge">{moroso.unidad}</span></td>
                      <td>{moroso.propietario}</td>
                      <td className="money">{formatMoney(moroso.deuda_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
