import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiShield,
  FiUserPlus,
  FiX
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    logout();
    navigate("/manage/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="topbar__brand" aria-label="Go to home page">
          <h1>
            <svg
              className="topbar__brand-star"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <linearGradient id="lilstar-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffe58a" />
                  <stop offset="48%" stopColor="#ffc72c" />
                  <stop offset="100%" stopColor="#d68a00" />
                </linearGradient>
              </defs>
              <path
                fill="url(#lilstar-gold-gradient)"
                d="M12 2.8l2.64 5.35 5.9.86-4.27 4.16 1.01 5.88L12 16.3 6.72 19.05l1.01-5.88L3.46 9.01l5.9-.86L12 2.8z"
              />
            </svg>
            LilStar
          </h1>
        </Link>

        <button
          type="button"
          className="topbar__toggle"
          aria-label="Toggle navigation"
          aria-expanded={isNavOpen}
          onClick={() => setIsNavOpen((previous) => !previous)}
        >
          {isNavOpen ? <FiX /> : <FiMenu />}
        </button>

        <nav className={`topbar__nav ${isNavOpen ? "topbar__nav--open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `topbar__link${isActive ? " topbar__link--active" : ""}`
            }
          >
            <FiHome />
            Home
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/manage/dashboard"
                className={({ isActive }) =>
                  `topbar__link${isActive ? " topbar__link--active" : ""}`
                }
              >
                <FiSettings />
                Dashboard
              </NavLink>
              <Link
                to="/manage/dashboard#password-section"
                className="topbar__link topbar__quick"
              >
                <FiShield />
                Security
              </Link>
              {user?.role === "admin" ? (
                <Link
                  to="/manage/dashboard#users-section"
                  className="topbar__link topbar__quick"
                >
                  <FiUserPlus />
                  Add User
                </Link>
              ) : null}
              <span className="role-chip">{user?.role || "staff"}</span>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                <FiLogOut />
                Logout
              </button>
            </>
          ) : null}
        </nav>
      </header>

      <main className="content-wrap">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} LilStar. Crafted for faster catalog operations.</p>
      </footer>
    </div>
  );
}

export default Layout;
