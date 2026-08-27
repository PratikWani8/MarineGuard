import { SearchX } from "lucide-react";
export default function EmptyState({ title = "Nothing here yet", description = "No records match the current view." }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.03] p-10 text-center"><SearchX className="mx-auto mb-3 text-slate-500" size={30}/><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-slate-500">{description}</p></div>;
}