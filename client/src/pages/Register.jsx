import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  Waves,
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { register as registerApi } from "../services/authApi";

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "operator",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const response = await registerApi({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      const data = response.data?.data;

      if (data?.token) {
        localStorage.setItem("marineguard_token", data.token);

        if (data.user) {
          localStorage.setItem(
            "marineguard_user",
            JSON.stringify(data.user)
          );
        }

        navigate("/dashboard");
      } else {
        navigate("/login", {
          state: {
            registered: true,
            email: form.email,
          },
        });
      }
    } catch (err) {
      setError(
        err.userMessage ||
          err.response?.data?.error?.message ||
          "Unable to create your account."
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
    <div className="absolute inset-0 bg-ocean-950/50" />

    <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/75 via-ocean-950/40 to-ocean-950/20" />

    {/* Page Content */}
    <div className="relative z-10 min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-end px-5 py-8 sm:px-8 lg:px-12">

        {/* Register Card */}
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-3xl border border-white/15 bg-ocean-950/70 p-7 shadow-2xl backdrop-blur-xl sm:p-9"
        >
          {/* Mobile Logo */}
          <div className="mb-7 lg:hidden">
            <Waves
              className="text-cyan-300"
              size={30}
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
            New operator registration
          </p>

          <h2 className="mt-2 text-3xl font-semibold">
            Create your account
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Set up your secure MarineGuard workspace.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {/* Name */}
          <label
            htmlFor="name"
            className="mt-6 block text-sm text-slate-300"
          >
            Full name
          </label>

          <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-400/50 focus-within:ring-1 focus-within:ring-cyan-400/20">
            <User
              size={17}
              className="shrink-0 text-slate-500"
            />

            <input
              id="name"
              required
              type="text"
              name="name"
              value={form.name}
              onChange={updateField}
              autoComplete="name"
              className="w-full bg-transparent px-3 py-3 outline-none placeholder:text-slate-600"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <label
            htmlFor="email"
            className="mt-4 block text-sm text-slate-300"
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

          {/* Role */}
          <label
            htmlFor="role"
            className="mt-4 block text-sm text-slate-300"
          >
            Role
          </label>

          <select
            id="role"
            name="role"
            value={form.role}
            onChange={updateField}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b202c]/90 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
          >
            <option value="operator">
              Operator
            </option>

            <option value="researcher">
              Researcher
            </option>
          </select>

          {/* Password */}
          <label
            htmlFor="password"
            className="mt-4 block text-sm text-slate-300"
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
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-transparent px-3 py-3 outline-none placeholder:text-slate-600"
              placeholder="Minimum 8 characters"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
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

          {/* Confirm Password */}
          <label
            htmlFor="confirmPassword"
            className="mt-4 block text-sm text-slate-300"
          >
            Confirm password
          </label>

          <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition focus-within:border-cyan-400/50 focus-within:ring-1 focus-within:ring-cyan-400/20">
            <Lock
              size={17}
              className="shrink-0 text-slate-500"
            />

            <input
              id="confirmPassword"
              required
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-transparent px-3 py-3 outline-none placeholder:text-slate-600"
              placeholder="Repeat your password"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              aria-label={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>

          {/* Password Requirement */}
          <div className="mt-3 text-xs text-slate-500">
            Password must contain at least 8 characters.
          </div>

          {/* Submit */}
          <button
            disabled={busy}
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-ocean-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Creating account..."
              : "Create MarineGuard Account"}

            {!busy && <ArrowRight size={17} />}
          </button>

          {/* Login */}
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}

            <Link
              to="/login"
              className="font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              Sign in
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-[11px] text-slate-600">
            MarineGuard AI · Underwater Intelligence Platform
          </p>
        </form>
      </div>
    </div>
  </div>
);

}