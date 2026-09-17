import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  GitBranch,
  UserRound,
  Package,
  FileText,
  Settings,
  Database,
  CircleCheck,
  Brain,
} from "lucide-react";

const workspaceNavigation = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Revenue", path: "/revenue", icon: TrendingUp },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Opportunities", path: "/opportunities", icon: GitBranch },
  { label: "Sales Reps", path: "/sales-reps", icon: UserRound },
  { label: "Products", path: "/products", icon: Package },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "AI Sales Intelligence", path: "/ai", icon: Brain },
];

const pageNames = {
  "/": "Overview",
  "/revenue": "Revenue",
  "/customers": "Customers",
  "/opportunities": "Opportunities",
  "/sales-reps": "Sales Representatives",
  "/products": "Products",
  "/reports": "Reports",
  "/ai": "AI Sales Intelligence",
  "/settings": "Settings",
};

export default function AppLayout() {
  const location = useLocation();
  const currentPage = pageNames[location.pathname] || "CRM Analytics";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>

          <div className="brand-copy">
            <strong>CRM Analytics</strong>
            <span>Sales intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-section-label">WORKSPACE</div>

            <div className="nav-list">
              {workspaceNavigation.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="nav-icon">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>

                  <span className="nav-label">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="nav-group nav-group-system">
            <div className="nav-section-label">SYSTEM</div>

            <div className="nav-list">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">
                  <Settings size={18} strokeWidth={1.8} />
                </span>

                <span className="nav-label">Settings</span>
              </NavLink>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="database-status">
            <div className="database-icon">
              <Database size={16} strokeWidth={1.8} />
            </div>

            <div className="database-copy">
              <strong>Live database</strong>

              <span>
                <CircleCheck size={11} strokeWidth={2.2} />
                MySQL connected
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-context">
            <span className="topbar-overline">CRM / ANALYTICS</span>
            <strong>{currentPage}</strong>
          </div>

          <div className="topbar-right">
            <div className="environment">
              <span className="environment-dot" />
              Production Data
            </div>

            <button
              type="button"
              className="avatar"
              aria-label="User profile"
              title="User profile"
            >
              SY
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
