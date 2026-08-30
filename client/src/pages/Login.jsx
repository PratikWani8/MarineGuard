import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Waves,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
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
  <div className="relative min-h-screen overflow-hidden bg-ocean-950 text-white">
    {/* Background Video */}
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src="/storm-ocean.mp4" type="video/mp4" />
    </video>

    {/* Video Overlay */}
    <div className="absolute inset-0 bg-ocean-950/45" />
    <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/70 via-ocean-950/35 to-ocean-950/20" />

    {/* Page Content */}
    <div className="relative z-10 min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-end px-5 py-8 sm:px-8 lg:px-12">
        
        {/* Login Card */}
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-3xl border border-white/15 bg-ocean-950/70 p-7 shadow-2xl backdrop-blur-xl sm:p-9"
        >
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Waves className="text-cyan-300" size={32} />

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

          <p className="mt-2 text-sm text-slate-400">
            Sign in to your marine command center.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* Email */}
          <label
            htmlFor="email"
            className="mt-7 block text-sm text-slate-300"
          >
            Email
          </label>

          <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-400/50 focus-within:ring-1 focus-within:ring-cyan-400/20">
            <Mail
              size={17}
              className="shrink-0 text-slate-500"
            />

            <input
              id="email"
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
          <label
            htmlFor="password"
            className="mt-5 block text-sm text-slate-300"
          >
            Password
          </label>

          <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-400/50 focus-within:ring-1 focus-within:ring-cyan-400/20">
            <Lock
              size={17}
              className="shrink-0 text-slate-500"
            />

            <input
              id="password"
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
              onClick={() => setShowPassword((value) => !value)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>

          {/* Login Button */}
          <button
            disabled={busy}
            type="submit"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-ocean-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Enter Command Center"}

            {!busy && <ArrowRight size={17} />}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />

            <span className="text-xs text-slate-500">
              OR
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Register */}
          <div className="rounded-xl border border-white/10 bg-white/[.035] p-4 text-center">
            <p className="text-sm text-slate-400">
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
          <p className="mt-6 text-center text-[11px] text-slate-500">
            MarineGuard AI · Underwater Intelligence Platform
          </p>
        </form>
      </div>
    </div>
  </div>
);
}
