import { riskClass } from "../../utils/format";
export default function RiskBadge({ risk }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${riskClass(risk)}`}>{risk || "LOW"}</span>;
}