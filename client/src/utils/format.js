export const cx = (...classes) => classes.filter(Boolean).join(" ");

export function riskClass(risk = "LOW") {
  return {
    LOW: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
    MEDIUM: "text-amber-300 bg-amber-400/10 border-amber-400/20",
    HIGH: "text-orange-300 bg-orange-400/10 border-orange-400/20",
    CRITICAL: "text-rose-300 bg-rose-400/10 border-rose-400/20"
  }[risk] || "text-slate-300 bg-slate-400/10 border-slate-400/20";
}

export function formatNumber(value, digits = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}