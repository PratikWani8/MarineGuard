import { useMemo, useState } from "react";
import { Maximize2, Minimize2, ScanLine } from "lucide-react";
import RiskBadge from "../detection/RiskBadge";

export default function SonarViewer({ src, detections=[] }) {
  const [boxes,setBoxes]=useState(true), [full,setFull]=useState(false);
  const dims = useMemo(()=>src ? null : null,[src]);
  return <div className={`${full?"fixed inset-3 z-50 bg-[#06131f]":"relative"} overflow-hidden rounded-2xl border border-white/10`}>
    <div className="absolute left-3 top-3 z-10 flex gap-2"><button onClick={()=>setBoxes(!boxes)} className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs backdrop-blur">{boxes?"Hide":"Show"} boxes</button><button onClick={()=>setFull(!full)} className="rounded-lg border border-white/10 bg-black/50 p-2 backdrop-blur">{full?<Minimize2 size={15}/>:<Maximize2 size={15}/>}</button></div>
    <div className="relative min-h-[420px] bg-[#0b202c]">
      {src ? <img src={src} className="h-full min-h-[420px] w-full object-contain" alt="Sonar frame"/> : <div className="grid min-h-[420px] place-items-center text-slate-600"><div className="text-center"><ScanLine className="mx-auto mb-2" size={35}/><p>Upload a sonar frame to inspect it</p></div></div>}
      {src && boxes && detections.map((d,i)=> {
        const b=d.boundingBox||{}; if(!Number.isFinite(Number(b.x1))) return null;
        return <div key={d.detectionId||i} className="pointer-events-none absolute border-2 border-cyan-300" style={{left:`${b.x1}px`,top:`${b.y1}px`,width:`${b.width||Math.max(1,b.x2-b.x1)}px`,height:`${b.height||Math.max(1,b.y2-b.y1)}px`}}><div className="absolute -top-7 left-0 flex items-center gap-2 whitespace-nowrap rounded bg-ocean-950/90 px-2 py-1 text-[10px]"><span>{d.classification}</span><RiskBadge risk={d.riskLevel}/></div></div>
      })}
    </div>
  </div>;
}