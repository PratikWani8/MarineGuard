import { useEffect, useState } from "react";
import { Activity, Anchor, AlertTriangle, Crosshair, Fish, Gauge, Waves, Ruler, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getOverview } from "../services/dashboardApi";
import StatCard from "../components/common/StatCard";
import Loading from "../components/common/Loading";
import { formatNumber } from "../utils/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function Dashboard() {
  const [data, setData] = useState(null); const [error, setError] = useState("");
  useEffect(() => { getOverview().then(r => setData(r.data.data)).catch(e => setError(e.userMessage || "Could not load dashboard")); }, []);
  if (!data && !error) return <Loading label="Loading command center..." />;
  if (error) return <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-300">{error}</div>;

  const chart = [
    {name:"Ghost nets", value:data.ghostNets}, {name:"Shipwrecks", value:data.shipwrecks},
    {name:"Pipes", value:data.pipes}, {name:"Other", value:Math.max(0,(data.totalDetections||0)-(data.ghostNets||0)-(data.shipwrecks||0)-(data.pipes||0))}
  ];
  return <div className="space-y-7">
    <div><p className="text-sm text-cyan-300">Marine operations</p><h1 className="mt-1 text-3xl font-semibold">Command Center</h1><p className="mt-2 text-sm text-slate-500">Survey intelligence, anomaly risk and cleanup readiness.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={Waves} label="Total Surveys" value={data.totalSurveys}/>
      <StatCard icon={Activity} label="Sonar Frames" value={data.totalFrames}/>
      <StatCard icon={Crosshair} label="Detected Anomalies" value={data.totalDetections}/>
      <StatCard icon={AlertTriangle} label="Critical Hazards" value={data.criticalDetections}/>
      <StatCard icon={Fish} label="Ghost Nets" value={data.ghostNets}/>
      <StatCard icon={Anchor} label="Shipwrecks" value={data.shipwrecks}/>
      <StatCard icon={Gauge} label="Avg. Confidence" value={`${formatNumber(data.averageConfidence,1)}%`}/>
      <StatCard icon={Ruler} label="Estimated Debris Area" value={`${formatNumber(data.totalEstimatedArea,1)} m²`}/>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold">Detection profile</h2><p className="text-xs text-slate-500">Class distribution from stored AI results.</p></div><Link to="/map" className="text-xs text-cyan-300">Open map →</Link></div>
        <div className="mt-6 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><XAxis dataKey="name" stroke="#64748b" tick={{fontSize:11}}/><YAxis stroke="#64748b" allowDecimals={false}/><Tooltip contentStyle={{background:"#0b1f2c",border:"1px solid rgba(255,255,255,.1)",borderRadius:12}}/><Bar dataKey="value" fill="#22d3ee" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
      </section>
      <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[.03] p-5"><h2 className="font-semibold">Operations</h2><div className="mt-5 space-y-3"><Link to="/surveys" className="flex items-center justify-between rounded-xl border border-white/10 p-4 hover:bg-white/5"><span><span className="block text-sm font-medium">Manage surveys</span><span className="text-xs text-slate-500">Upload and analyze sonar frames</span></span><ArrowRight size={16}/></Link><Link to="/missions" className="flex items-center justify-between rounded-xl border border-white/10 p-4 hover:bg-white/5"><span><span className="block text-sm font-medium">Plan cleanup</span><span className="text-xs text-slate-500">Prioritize high-risk targets</span></span><ArrowRight size={16}/></Link><Link to="/reports" className="flex items-center justify-between rounded-xl border border-white/10 p-4 hover:bg-white/5"><span><span className="block text-sm font-medium">Export reports</span><span className="text-xs text-slate-500">JSON, CSV and PDF survey outputs</span></span><ArrowRight size={16}/></Link></div></section>
    </div>
  </div>;
}