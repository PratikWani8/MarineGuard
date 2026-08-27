export default function Loading({ label = "Loading..." }) {
  return <div className="flex items-center justify-center gap-3 py-10 text-slate-400"><span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />{label}</div>;
}