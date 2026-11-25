import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Package,
  Shield,
  PlusCircle,
  PackageSearch,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  {
    to: "/",
    label: "Retrieve",
    fullLabel: "Retrieve Lost Item",
    icon: PackageSearch,
    dataFr: "FR-003",
  },
  {
    to: "/log-item",
    label: "Report",
    fullLabel: "Report Found Item",
    icon: PlusCircle,
    dataFr: "FR-001",
  },
  { to: "/track", label: "Track", fullLabel: "Track Claim", icon: Package },
];

function isActivePath(pathname, to) {
  if (to === "/") {
    return (
      pathname === "/" ||
      pathname === "/retrieve" ||
      pathname.startsWith("/item/") ||
      pathname.startsWith("/claim")
    );
  }
  if (to === "/log-item") {
    return pathname === "/log-item" || pathname === "/report-item";
  }
  return pathname === to;
}

export default function PublicHeader() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on Escape and return focus to the toggle button
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Close when clicking outside the menu / toggle button
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const mobileLinkStyle = (isActive) =>
    `flex items-center gap-3 px-4 py-3 text-base border-b border-blue-700 last:border-b-0 transition-colors ${
      isActive
        ? "bg-blue-900 text-white font-semibold"
        : "text-blue-100 hover:bg-blue-900 hover:text-white font-medium"
    }`;

  return (
    <header className="bg-blue-800 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group min-h-[44px] min-w-0 flex-1 md:flex-none"
        >
          <img
            src="/campusfind.svg"
            alt=""
            aria-hidden="true"
            className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-base md:text-lg leading-tight truncate">
              CampusFind
            </div>
            <div className="text-blue-200 text-[10px] md:text-xs leading-tight truncate">
              KNIT, Sultanpur — Lost &amp; Found
            </div>
          </div>
        </Link>

        {/* Desktop Navigation (md and up) */}
        <nav
          className="hidden md:flex items-center gap-2 lg:gap-4 flex-shrink-0"
          aria-label="Main Navigation"
        >
          {NAV_ITEMS.map(({ to, fullLabel, icon: Icon, dataFr }) => (
            <Link
              key={to}
              to={to}
              data-fr={dataFr}
              className={`flex items-center gap-2 text-sm py-2 px-2.5 lg:px-3 transition-colors min-h-[44px] border-b-2 ${
                isActivePath(location.pathname, to)
                  ? "border-white text-white font-semibold"
                  : "border-transparent text-blue-200 hover:text-white font-medium"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{fullLabel}</span>
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger toggle (below md) */}
        <button
          ref={buttonRef}
          type="button"
          className="md:hidden flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="w-6 h-6" aria-hidden="true" />
          ) : (
            <Menu className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile slide-down menu (below md) */}
      {menuOpen && (
        <nav
          id="mobile-nav-menu"
          ref={menuRef}
          className="md:hidden bg-blue-800 border-t border-blue-700 shadow-lg"
          aria-label="Mobile Navigation"
        >
          <ul className="max-w-6xl mx-auto">
            {NAV_ITEMS.map(({ to, fullLabel, icon: Icon, dataFr }) => {
              const active = isActivePath(location.pathname, to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    data-fr={dataFr}
                    className={mobileLinkStyle(active)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon
                      className="w-5 h-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{fullLabel}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}

const CURRENT_YEAR = new Date().getFullYear();

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm py-6 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-center sm:text-left">
          © {CURRENT_YEAR} CampusFind — KNIT, Sultanpur
        </span>
        <Link
          to="/admin/login"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors min-h-[44px] px-2"
        >
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          Admin login
        </Link>
      </div>
    </footer>
  );
}
