import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { getSurvey } from "../services/surveyApi";
import { getDetections } from "../services/detectionApi";
import SonarViewer from "../components/sonar/SonarViewer";
import RiskBadge from "../components/detection/RiskBadge";
import Loading from "../components/common/Loading";
import { formatNumber } from "../utils/format";

export default function SonarAnalysis() {
  const [params]=useSearchParams(); const surveyId=params.get("survey"); const [survey,setSurvey]=useState(null),[detections,setDetections]=useState([]),[loading,setLoading]=useState(true);
  useEffect(()=>{if(!surveyId)return setLoading(false);Promise.all([getSurvey(surveyId),getDetections({surveyId})]).then(([a,b])=>{setSurvey(a.data.data);setDetections(b.data.data.items||[])}).finally(()=>setLoading(false))},[surveyId]);
  if(loading)return <Loading/>; if(!surveyId)return <div className="rounded-2xl border border-white/10 p-8">Open analysis from a survey.</div>;
  return <div className="space-y-5"><Link to={survey?`/surveys/${surveyId}`:"/surveys"} className="flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/>Back</Link><div className="flex items-end justify-between"><div><p className="text-xs text-cyan-300">{survey?.surveyId}</p><h1 className="text-3xl font-semibold">Sonar analysis</h1></div><Link to={`/surveys/${surveyId}`} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-ocean-950"><UploadCloud size={16}/>Upload frame</Link></div><div className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]"><SonarViewer detections={detections}/><section className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><h2 className="font-semibold">Detected anomalies</h2><div className="mt-4 space-y-2">{detections.length?detections.map(d=><Link key={d.detectionId} to={`/detections/${d.detectionId}`} className="block rounded-xl border border-white/5 bg-black/10 p-3 hover:bg-white/5"><div className="flex items-center justify-between"><span className="font-medium capitalize">{d.classification?.replaceAll("_"," ")}</span><RiskBadge risk={d.riskLevel}/></div><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Confidence <b className="text-slate-300">{formatNumber(d.confidence)}%</b></span><span>Hazard <b className="text-slate-300">{formatNumber(d.hazardScore)} / 100</b></span></div></Link>):<p className="py-8 text-center text-sm text-slate-600">No detections in this survey.</p>}</div></section></div></div>;
}