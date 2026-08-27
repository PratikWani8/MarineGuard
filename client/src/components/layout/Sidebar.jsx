import { NavLink } from "react-router-dom";
import { LayoutDashboard, Waves, Map, Route, FileText, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const links = [
  ["/dashboard", LayoutDashboard, "Command Center"],
  ["/surveys", Waves, "Surveys"],
  ["/map", Map, "Marine Map"],
  ["/missions", Route, "Cleanup Missions"],
  ["/reports", FileText, "Reports"]
];

export default function Sidebar({ mobile = false }) {
  const { user, logout } = useAuth();
  return <aside className={`${mobile ? "" : "hidden lg:flex"} w-full lg:w-64 shrink-0 border-r border-white/10 bg-[#071824]`}>
    <div className="flex h-full flex-col p-4">
      <div className="mb-7 flex items-center gap-3 px-2 pt-2">
        <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><img
            src="/marineguard_logo.png"
            alt="Logo"
            className="h-11 w-auto object-contain"
          /></div>
        <div><div className="font-semibold">MarineGuard</div><div className="text-[10px] uppercase tracking-[.22em] text-cyan-300/70">AI Command</div></div>
      </div>
      <nav className="space-y-1">
        {links.map(([to, Icon, label]) => <NavLink key={to} to={to} className={({isActive}) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-cyan-400/10 text-cyan-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon size={17}/>{label}</NavLink>)}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[.03] p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-cyan-400/10 text-cyan-300"><ShieldCheck size={17}/></div><div className="min-w-0"><div className="truncate text-sm">{user?.name || "Operator"}</div><div className="text-xs capitalize text-slate-500">{user?.role || "operator"}</div></div></div>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-rose-400/10 hover:text-rose-300"><LogOut size={17}/>Sign out</button>
      </div>
    </div>
  </aside>;
}