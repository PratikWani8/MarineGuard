import {
  CheckCircle2,
  Database,
  FileText,
  MapPin,
  ScanSearch,
  Sparkles,
  Waves,
  ArrowDown,
  Radar,
} from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const steps = [
  {
    number: "01",
    icon: Database,
    title: "Raw Sonar",
    description:
      "Side-scan sonar frames enter the system as acoustic imagery collected during an underwater survey.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI Preprocessing",
    description:
      "The incoming imagery is prepared and structured for reliable downstream analysis.",
  },
  {
    number: "03",
    icon: ScanSearch,
    title: "Object Detection",
    description:
      "AI identifies known marine objects and debris categories within the sonar imagery.",
  },
  {
    number: "04",
    icon: Radar,
    title: "Anomaly Detection",
    description:
      "Suspicious patterns that do not confidently match known classes are surfaced for further attention.",
  },
  {
    number: "05",
    icon: CheckCircle2,
    title: "Validation",
    description:
      "Detection confidence and available evidence are considered before assigning an operational state.",
  },
  {
    number: "06",
    icon: MapPin,
    title: "Geotagging",
    description:
      "Important findings can be associated with their survey location for spatial analysis and prioritization.",
  },
  {
    number: "07",
    icon: FileText,
    title: "Actionable Report",
    description:
      "The final intelligence is organized into structured results that can support follow-up operations.",
  },
];

export default function HowItWorks() {
  return (
    <div className="bg-ocean-950 text-white">
        <Navbar />
  
      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: 0.8,
          }}
          className="max-w-4xl"
        >
          <span className="eyebrow">
            <Waves size={13} />
            End-to-end pipeline
          </span>

          <h2 className="mt-7 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            From raw sonar to{" "}
            <span className="text-cyan-300">
              actionable intelligence.
            </span>
          </h2>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-400">
            MarineGuard AI combines preprocessing, known-object
            detection, anomaly analysis, validation and geotagging
            into a unified underwater intelligence workflow.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24 lg:px-8 lg:pb-32">
        <div className="relative">
          {/* Vertical connection line */}
          <div className="absolute left-6 top-6 hidden h-[calc(100%-3rem)] w-px bg-gradient-to-b from-cyan-300/50 via-cyan-300/20 to-transparent md:block" />

          <div className="space-y-6">
            {steps.map(
              (
                {
                  number,
                  icon: Icon,
                  title,
                  description,
                },
                index
              ) => (
                <motion.div
                  key={number}
                  initial={{
                    opacity: 0,
                    x: index % 2 === 0 ? -45 : 45,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.65,
                    delay: 0.05,
                  }}
                  className="relative flex gap-5"
                >
                  {/* Number / Icon */}
                  <motion.div
                    whileHover={{
                      scale: 1.12,
                      rotate: 4,
                    }}
                    className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-ocean-950 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
                  >
                    <Icon size={20} />
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    whileHover={{
                      y: -4,
                    }}
                    className="glass flex-1 rounded-2xl p-6 transition-colors hover:border-cyan-300/20"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-bold tracking-[0.2em] text-cyan-300/60">
                        STEP {number}
                      </span>

                      {index < steps.length - 1 && (
                        <span className="hidden text-xs text-slate-600 sm:block">
                          NEXT
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-xl font-semibold text-white">
                      {title}
                    </h3>

                    <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                      {description}
                    </p>
                  </motion.div>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          INTELLIGENCE LAYERS
      ====================================================== */}

      <section className="border-y border-white/5 bg-white/[.02]">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.7,
            }}
            className="max-w-3xl"
          >
            <span className="eyebrow">
              Intelligence layers
            </span>

            <h2 className="mt-5 text-3xl font-semibold sm:text-5xl">
              Multiple signals.{" "}
              <span className="text-cyan-300">
                One operational picture.
              </span>
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              MarineGuard does not rely on a single interpretation layer.
              Different stages contribute information to help build a
              more useful picture of what may be present underwater.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Known Targets",
                text: "Objects that match supported detection categories can be identified and structured.",
                icon: ScanSearch,
              },
              {
                title: "Unknown Anomalies",
                text: "Suspicious patterns outside confident known classes can be surfaced for investigation.",
                icon: Radar,
              },
              {
                title: "Safety-Aware States",
                text: "Results can be organized around confidence and evidence instead of treating every prediction equally.",
                icon: CheckCircle2,
              },
            ].map(
              ({ title, text, icon: Icon }, index) => (
                <motion.div
                  key={title}
                  initial={{
                    opacity: 0,
                    y: 35,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.12,
                    duration: 0.6,
                  }}
                  whileHover={{
                    y: -8,
                  }}
                  className="group rounded-2xl border border-cyan-300/10 bg-cyan-300/[.03] p-7 transition-colors hover:border-cyan-300/25"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10 transition-transform duration-300 group-hover:scale-110">
                    <Icon
                      size={24}
                      className="text-cyan-300"
                    />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {text}
                  </p>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          SIMPLE FLOW
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.97,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.7,
          }}
          className="rounded-[2rem] border border-cyan-300/10 bg-cyan-300/[.025] p-8 sm:p-12"
        >
          <div className="text-center">
            <span className="eyebrow">
              MarineGuard workflow
            </span>

            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Survey → Analyze → Understand → Act
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {[
              "Survey",
              "Analyze",
              "Understand",
              "Act",
            ].map((item, index) => (
              <div
                key={item}
                className="relative"
              >
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.12,
                  }}
                  whileHover={{
                    scale: 1.04,
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[.035] p-6 text-center"
                >
                  <div className="text-xs font-bold tracking-widest text-cyan-300/60">
                    0{index + 1}
                  </div>

                  <p className="mt-3 font-semibold">
                    {item}
                  </p>
                </motion.div>

                {index < 3 && (
                  <ArrowDown
                    size={18}
                    className="mx-auto mt-3 text-cyan-300/40 md:absolute md:-right-3 md:top-1/2 md:mt-0 md:rotate-[-90deg]"
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>
      <Footer />
    </div>
  );
}
