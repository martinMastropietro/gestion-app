"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  CreditCard, 
  AlertTriangle, 
  LogOut,
  Building2
} from "lucide-react";
import "./Sidebar.css";

const NAV_ITEMS = [
  { label: "Overview", href: "/home", icon: LayoutDashboard },
  { label: "Residentes", href: "/unidades", icon: Users },
  { label: "Gastos", href: "/gastos", icon: Receipt },
  { label: "Expensas", href: "/expensas", icon: Receipt },
  { label: "Pagos", href: "/pagos", icon: CreditCard },
  { label: "Morosos", href: "/morosos", icon: AlertTriangle },
];

export default function Sidebar({ userProfile }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    window.localStorage.removeItem("userId");
    window.localStorage.removeItem("userRole");
    router.push("/");
  };

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-box">
          <Building2 size={20} color="#2563eb" />
        </div>
        <span className="logo-text">Consorcios</span>
      </div>

      <nav className="nav-group">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">
            {userProfile?.user?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="user-details">
            <span className="user-name">{userProfile?.user || "Usuario"}</span>
            <span className="user-role">Administrador</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
