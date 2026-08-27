import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  Waves,
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
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

      /*
       * Backend registration responses may either:
       * 1. Return a token immediately
       * 2. Only create the account
       */
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.12),transparent_38%),#06131f] p-4 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] shadow-2xl lg:grid-cols-2">

          {/* LEFT PANEL */}
          <div className="hidden min-h-[700px] flex-col justify-between bg-[linear-gradient(145deg,#0b2a3b,#06131f)] p-10 lg:flex">

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

            <div>
              <p className="max-w-lg text-5xl font-semibold leading-tight">
                Join the marine intelligence network.
              </p>

              <p className="mt-5 max-w-md text-slate-400">
                Create an operator account to analyze side-scan sonar,
                investigate underwater anomalies and coordinate cleanup
                missions.
              </p>

              <div className="mt-8 space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                    <ShieldCheck size={16} />
                  </span>
                  Secure JWT authentication
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                    <Waves size={16} />
                  </span>
                  AI-powered sonar intelligence
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                    <ShieldCheck size={16} />
                  </span>
                  Role-based marine operations
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              YOLO transfer learning · U-Net · acoustic intelligence
            </div>
          </div>

          {/* RIGHT FORM */}
          <form
            onSubmit={submit}
            className="flex min-h-[700px] flex-col justify-center p-7 sm:p-10"
          >

            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Waves className="text-cyan-300" size={30} />

              <h1 className="mt-3 text-2xl font-semibold">
                MarineGuard AI
              </h1>

              <p className="mt-1 text-xs uppercase tracking-[.2em] text-cyan-300/70">
                Command Center
              </p>
            </div>

            <p className="text-sm text-cyan-300">
              New operator registration
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Set up your secure MarineGuard workspace.
            </p>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            {/* Name */}
            <label className="mt-6 text-sm text-slate-400">
              Full name
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/10 px-3 focus-within:border-cyan-400/40">
              <User size={17} className="text-slate-500" />

              <input
                required
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                className="w-full bg-transparent px-3 py-3 outline-none"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <label className="mt-4 text-sm text-slate-400">
              Email
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/10 px-3 focus-within:border-cyan-400/40">
              <Mail size={17} className="text-slate-500" />

              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                className="w-full bg-transparent px-3 py-3 outline-none"
                placeholder="operator@example.com"
              />
            </div>

            {/* Role */}
            <label className="mt-4 text-sm text-slate-400">
              Role
            </label>

            <select
              name="role"
              value={form.role}
              onChange={updateField}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b202c] px-3 py-3 text-sm outline-none focus:border-cyan-400/40"
            >
              <option value="operator">
                Operator
              </option>

              <option value="researcher">
                Researcher
              </option>
            </select>

            {/* Password */}
            <label className="mt-4 text-sm text-slate-400">
              Password
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/10 px-3 focus-within:border-cyan-400/40">
              <Lock size={17} className="text-slate-500" />

              <input
                required
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={updateField}
                minLength={8}
                className="w-full bg-transparent px-3 py-3 outline-none"
                placeholder="Minimum 8 characters"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <label className="mt-4 text-sm text-slate-400">
              Confirm password
            </label>

            <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/10 px-3 focus-within:border-cyan-400/40">
              <Lock size={17} className="text-slate-500" />

              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={updateField}
                minLength={8}
                className="w-full bg-transparent px-3 py-3 outline-none"
                placeholder="Repeat your password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="p-1 text-slate-500 hover:text-slate-300"
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {/* Password requirement */}
            <div className="mt-3 text-xs text-slate-500">
              Password must contain at least 8 characters.
            </div>

            {/* Submit */}
            <button
              disabled={busy}
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-ocean-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? "Creating account..."
                : "Create MarineGuard Account"}

              <ArrowRight size={17} />
            </button>

            {/* Login */}
            <div className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}