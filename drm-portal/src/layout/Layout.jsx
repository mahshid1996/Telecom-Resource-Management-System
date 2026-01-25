import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../api/client";

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const token = getToken();

React.useEffect(() => {
  if (!token && loc.pathname !== "/login") {
    nav("/login", { replace: true });
  }
}, [token, nav, loc.pathname]);

  const active = (path) => loc.pathname === path || loc.pathname.startsWith(path + "/");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">DRM Portal</div>

        <div className="nav">
          <div
            className={`navItem ${active("/create-single-resource") ? "active" : ""}`}
            onClick={() => nav("/create-single-resource")}
          >
            Create Single Resource
          </div>

          <div
            className={`navItem ${active("/config") ? "active" : ""}`}
            onClick={() => nav("/config")}
          >
            Config
          </div>

          <div
            className={`navItem ${active("/categories") ? "active" : ""}`}
            onClick={() => nav("/categories")}
          >
            Categories
          </div>
                    <div
            className={`navItem ${active("/bulk") ? "active" : ""}`}
            onClick={() => nav("/bulk")}
          >
            Bulk Operations
          </div>

          {/* later you can add: Bulk Ops, Categories, Notifications, Live Chat */}
        </div>

        <div className="footerBtn">
          <button
            className="btn btn-primary"
            onClick={() => {
              clearToken();
              nav("/login");
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}