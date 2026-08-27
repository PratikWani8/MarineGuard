import { ArrowRight, Waves } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-white/5 bg-ocean-950">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        {/* Main Footer */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
                <img
            src="/marineguard_logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
              </div>

              <div>
                <p className="text-lg font-semibold text-white">
                  MarineGuard AI
                </p>

                <p className="text-xs text-slate-500">
                  Side-scan sonar intelligence
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              AI-powered underwater intelligence for detecting
              marine debris, ghost nets, shipwrecks and suspicious
              sonar anomalies.
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="btn-primary mt-6"
            >
              Analyze Sonar
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Home
              </Link>

              <Link
                to="/about"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                About Us
              </Link>

              <Link
                to="/how-it-works"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                How It Works
              </Link>

              <Link
                to="/technology"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Technology
              </Link>

              <Link
                to="/impact"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Impact
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Platform
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/login"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Create Account
              </Link>

              <Link
                to="/dashboard"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Dashboard
              </Link>

              <Link
                to="/surveys"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Surveys
              </Link>

              <Link
                to="/reports"
                className="text-sm text-slate-400 transition hover:text-cyan-300"
              >
                Reports
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-7 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-500">
            © {new Date().getFullYear()} MarineGuard AI. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <span className="text-slate-600">
              Built for smarter oceans.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}