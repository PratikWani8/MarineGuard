import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Waves,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.userMessage ||
          err.response?.data?.error?.message ||
          "Unable to sign in."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.12),transparent_38%),#06131f] p-4 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] shadow-2xl lg:grid-cols-2">

          {/* =====================================================
              LEFT BRAND PANEL
          ====================================================== */}
          <div className="hidden min-h-[620px] flex-col justify-between bg-[linear-gradient(145deg,#0b2a3b,#06131f)] p-10 lg:flex">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
                <Waves size={25} />
              </span>

              <div>
                <div className="font-semibold">
                  MarineGuard AI
                </div>

                <div className="text-[10px] uppercase tracking-[.25em] text-cyan-300/70">
                  Command Center
                </div>
              </div>
            </div>

            {/* Hero */}
            <div>
              <p className="max-w-lg text-5xl font-semibold leading-tight">
                See what the ocean is hiding.
              </p>

              <p className="mt-5 max-w-md text-slate-400">
                AI-assisted side-scan sonar intelligence for debris
                detection, hazard scoring and underwater cleanup
                operations.
              </p>

              {/* Features */}
              <div className="mt-8 space-y-3 text-sm text-slate-400">

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                    <ShieldCheck size={16} />
                  </span>
                  Secure operator authentication
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                    <Waves size={16} />
                  </span>
                  AI-powered sonar intelligence
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                    <UserPlus size={16} />
                  </span>
                  Collaborative marine operations
                </div>

              </div>
            </div>

            {/* Technology */}
            <div className="text-xs text-slate-500">
              YOLO transfer learning · U-Net · acoustic intelligence
            </div>
          </div>

          {/* =====================================================
              LOGIN FORM
          ====================================================== */}
          <form
            onSubmit={submit}
            className="flex min-h-[620px] flex-col justify-center p-7 sm:p-10"
          >

            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Waves
                className="text-cyan-300"
                size={32}
              />

              <h1 className="mt-3 text-2xl font-semibold">
                MarineGuard AI
              </h1>

              <p className="mt-1 text-xs uppercase tracking-[.2em] text-cyan-300/70">
                Command Center
              </p>
            </div>

            {/* Heading */}
            <p className="text-sm text-cyan-300">
              Secure operator access
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to your marine command center.
            </p>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            {/* Email */}
            <label className="mt-7 text-sm text-slate-400">
              Email
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/10 px-3 transition focus-within:border-cyan-400/40 focus-within:ring-1 focus-within:ring-cyan-400/20">
              <Mail
                size={17}
                className="shrink-0 text-slate-500"
              />

              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
                className="w-full bg-transparent px-3 py-3 outline-none placeholder:text-slate-600"
                placeholder="operator@example.com"
              />
            </div>

            {/* Password */}
            <label className="mt-5 text-sm text-slate-400">
              Password
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/10 px-3 transition focus-within:border-cyan-400/40 focus-within:ring-1 focus-within:ring-cyan-400/20">
              <Lock
                size={17}
                className="shrink-0 text-slate-500"
              />

              <input
                required
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={updateField}
                autoComplete="current-password"
                className="w-full bg-transparent px-3 py-3 outline-none placeholder:text-slate-600"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {/* Login button */}
            <button
              disabled={busy}
              type="submit"
              className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-ocean-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? "Signing in..."
                : "Enter Command Center"}

              {!busy && <ArrowRight size={17} />}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-600">
                OR
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Register */}
            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4 text-center">
              <p className="text-sm text-slate-500">
                Don't have a MarineGuard account?
              </p>

              <Link
                to="/register"
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                <UserPlus size={16} />
                Create an account
              </Link>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-[11px] text-slate-600">
              MarineGuard AI · Underwater Intelligence Platform
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}