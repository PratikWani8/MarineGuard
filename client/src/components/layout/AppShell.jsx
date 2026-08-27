import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function AppShell() {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-[radial-gradient(circle_at_80%_0%,rgba(8,145,178,.10),transparent_35%),#06131f] text-slate-100">
    <div className="flex min-h-screen">
      <Sidebar />
      {open && <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setOpen(false)}><div className="h-full w-72" onClick={e => e.stopPropagation()}><Sidebar mobile /></div></div>}
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#06131f]/85 px-4 backdrop-blur-xl lg:px-7">
          <button className="mr-3 rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setOpen(true)}><Menu size={20}/></button>
          <div className="text-xs uppercase tracking-[.22em] text-slate-500">Underwater intelligence platform</div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
      </main>
    </div>
  </div>;
}