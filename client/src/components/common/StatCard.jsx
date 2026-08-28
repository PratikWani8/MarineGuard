import { motion } from "framer-motion";
export default function StatCard({ icon: Icon, label, value, meta }) {
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 shadow-glow">
    <div className="flex items-center justify-between"><span className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><Icon size={19}/></span>{meta && <span className="text-xs text-slate-500">{meta}</span>}</div>
    <p className="mt-5 text-sm text-slate-400">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
  </motion.div>;
}