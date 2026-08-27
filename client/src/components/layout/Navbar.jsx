import { ArrowRight, Menu, X } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    ["Home", "/"],
    ["About Us", "/about"],
    ["How It Works", "/how-it-works"],
    ["Technology", "/technology"],
    ["Impact", "/impact"],
  ];

  const handleAnalyze = () => {
    setOpen(false);
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-ocean-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

        {/* Logo */}
        <Link
  to="/"
  onClick={() => setOpen(false)}
  className="flex items-center gap-3"
>
  <img
    src="/marineguard_logo.png"
    alt="MarineGuard AI Logo"
    className="h-10 w-auto object-contain"
  />

  <span className="font-semibold whitespace-nowrap">
    MarineGuard{" "}
    <span className="text-cyan-300">AI</span>
  </span>
</Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map(([label, path]) => {
            const active = isActive(path);

            return (
              <Link
                key={label}
                to={path}
                className={`relative py-2 transition-colors ${
                  active
                    ? "text-cyan-300"
                    : "text-slate-300 hover:text-cyan-300"
                }`}
              >
                {label}

                {active && (
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-cyan-300" />
                )}
              </Link>
            );
          })}

          {/* Analyze Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            className="btn-primary py-2.5"
          >
            Analyze Sonar
            <ArrowRight size={16} />
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-white transition hover:bg-white/10 md:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <div className="border-t border-white/5 bg-ocean-950/95 p-5 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2">
            {links.map(([label, path]) => {
              const active = isActive(path);

              return (
                <Link
                  key={label}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 transition ${
                    active
                      ? "bg-cyan-300/10 text-cyan-300"
                      : "text-slate-300 hover:bg-white/5 hover:text-cyan-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{label}</span>

                    {active && (
                      <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Mobile Analyze Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              className="btn-primary mt-2"
            >
              Analyze Sonar
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
