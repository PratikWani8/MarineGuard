import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  Layers3,
  MapPinned,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

const fadeLeft = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const fadeRight = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const technologies = [
  {
    icon: ScanSearch,
    title: "Side-Scan Sonar Processing",
    description:
      "MarineGuard works with side-scan sonar imagery to extract meaningful visual and acoustic patterns from underwater environments.",
    tag: "SONAR",
  },
  {
    icon: BrainCircuit,
    title: "AI-Based Detection",
    description:
      "Computer vision models analyze sonar frames and identify potential underwater objects, debris and unusual structures.",
    tag: "AI / ML",
  },
  {
    icon: Cpu,
    title: "Intelligent Classification",
    description:
      "Detected regions can be organized into meaningful categories with confidence information for easier interpretation.",
    tag: "CLASSIFICATION",
  },
  {
    icon: MapPinned,
    title: "Geospatial Intelligence",
    description:
      "Detection results can be connected with geographic coordinates to provide spatial context for marine operations.",
    tag: "GEO",
  },
  {
    icon: Activity,
    title: "Risk-Aware Analysis",
    description:
      "Analysis results help highlight objects and anomalies that may require additional inspection or operational attention.",
    tag: "RISK",
  },
  {
    icon: Database,
    title: "Structured Data Pipeline",
    description:
      "Sonar frames, detections, confidence values and survey information can be organized into a structured analysis workflow.",
    tag: "DATA",
  },
];

const pipeline = [
  {
    number: "01",
    icon: Waves,
    title: "Sonar Acquisition",
    description:
      "Raw side-scan sonar data is collected during an underwater survey.",
  },
  {
    number: "02",
    icon: Layers3,
    title: "Image Processing",
    description:
      "The sonar frame is prepared and processed for AI-based interpretation.",
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "AI Inference",
    description:
      "Machine-learning models examine the imagery for objects and anomalies.",
  },
  {
    number: "04",
    icon: ScanSearch,
    title: "Object Detection",
    description:
      "Potential underwater targets are identified and structured.",
  },
  {
    number: "05",
    icon: MapPinned,
    title: "Spatial Context",
    description:
      "Detection information can be associated with geographic survey data.",
  },
  {
    number: "06",
    icon: ShieldCheck,
    title: "Decision Support",
    description:
      "Operators receive organized intelligence for further investigation.",
  },
];

const principles = [
  "AI-assisted rather than fully autonomous decisions",
  "Designed for underwater and sonar-based environments",
  "Structured detection and classification results",
  "Geospatial context for detected targets",
  "Scalable analysis workflow for sonar surveys",
  "Human review remains part of the decision process",
];

export default function Technology() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-ocean-950 text-white">
      <Navbar />

      <main>
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden px-5 pb-24 pt-36 lg:px-8 lg:pb-32 lg:pt-44">
          {/* Animated background elements */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-10 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl"
          />

          <motion.div
            animate={{
              x: [0, 40, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-40 top-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
          />

          <motion.div
            animate={{
              x: [0, -30, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl"
          />

          <div className="relative z-10 mx-auto max-w-7xl">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="mx-auto max-w-4xl text-center"
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300"
              >
                <Sparkles size={14} />
                MarineGuard Technology
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-.04em] sm:text-6xl lg:text-7xl"
              >
                Intelligence built
                <br />
                <span className="text-cyan-300">
                  for the deep.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-400"
              >
                MarineGuard combines sonar processing, computer vision,
                machine learning and geospatial intelligence to transform
                underwater imagery into structured marine intelligence.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-9 flex flex-wrap justify-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="btn-primary"
                >
                  Try Sonar Analysis
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/how-it-works")}
                  className="btn-secondary"
                >
                  See How It Works
                </button>
              </motion.div>
            </motion.div>

            {/* Technology visual */}
            <motion.div
              initial={{
                opacity: 0,
                y: 50,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: 1,
                delay: 0.4,
              }}
              className="relative mx-auto mt-20 max-w-5xl"
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-white/[.025] p-5 shadow-2xl shadow-cyan-950/30 sm:p-8">
                {/* Scanning animation */}
                <motion.div
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent"
                />

                <div className="relative grid gap-5 md:grid-cols-3">
                  {[
                    {
                      icon: Waves,
                      title: "SONAR",
                      text: "Acoustic imagery",
                    },
                    {
                      icon: BrainCircuit,
                      title: "AI ENGINE",
                      text: "Object intelligence",
                    },
                    {
                      icon: MapPinned,
                      title: "GEO INTELLIGENCE",
                      text: "Spatial context",
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.8 + index * 0.15,
                        }}
                        className="rounded-2xl border border-white/5 bg-black/20 p-6"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                          <Icon size={23} />
                        </div>

                        <p className="mt-5 text-xs tracking-[0.2em] text-cyan-300">
                          {item.title}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          {item.text}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="relative mt-5 rounded-2xl border border-white/5 bg-black/20 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                        className="h-2 w-2 rounded-full bg-cyan-300"
                      />

                      <span className="text-sm text-slate-300">
                        Analysis pipeline
                      </span>
                    </div>

                    <span className="text-xs text-cyan-300">
                      PROCESSING
                    </span>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "82%" }}
                      transition={{
                        duration: 2,
                        delay: 1,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-cyan-300"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            TECHNOLOGY STACK
        ====================================================== */}
        <section className="border-y border-white/5 bg-white/[.015] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="max-w-3xl"
            >
              <motion.span
                variants={fadeUp}
                className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300"
              >
                Technology Stack
              </motion.span>

              <motion.h2
                variants={fadeUp}
                className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                Multiple layers.
                <br />
                <span className="text-slate-500">
                  One intelligence platform.
                </span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-5 max-w-2xl text-lg leading-8 text-slate-400"
              >
                Each technology layer contributes to a complete underwater
                analysis workflow.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {technologies.map((technology) => {
                const Icon = technology.icon;

                return (
                  <motion.div
                    key={technology.title}
                    variants={fadeUp}
                    whileHover={{
                      y: -8,
                      transition: {
                        duration: 0.25,
                      },
                    }}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.035] p-7"
                  >
                    <motion.div
                      initial={{
                        scale: 0,
                      }}
                      whileInView={{
                        scale: 1,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        duration: 0.5,
                      }}
                      className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/5 blur-3xl"
                    />

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300 transition group-hover:bg-cyan-300/15">
                          <Icon size={23} />
                        </div>

                        <span className="text-[10px] font-medium tracking-[0.2em] text-slate-600">
                          {technology.tag}
                        </span>
                      </div>

                      <h3 className="mt-7 text-xl font-semibold">
                        {technology.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        {technology.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            PIPELINE
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="text-center"
          >
            <motion.span
              variants={fadeUp}
              className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300"
            >
              Processing Pipeline
            </motion.span>

            <motion.h2
              variants={fadeUp}
              className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              How the intelligence flows.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400"
            >
              From acoustic data acquisition to structured decision support,
              every stage contributes to the final analysis.
            </motion.p>
          </motion.div>

          <div className="relative mt-16">
            {/* Connecting line */}
            <div className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-cyan-300/30 via-cyan-300/10 to-transparent lg:block" />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="space-y-5"
            >
              {pipeline.map((item) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.number}
                    variants={fadeLeft}
                    className="relative grid gap-6 rounded-3xl border border-white/10 bg-white/[.025] p-6 transition hover:border-cyan-300/15 md:grid-cols-[80px_1fr] md:items-center md:p-7"
                  >
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-ocean-950 text-cyan-300">
                      <Icon size={22} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold tracking-[0.2em] text-cyan-300">
                          {item.number}
                        </span>

                        <h3 className="text-xl font-semibold">
                          {item.title}
                        </h3>
                      </div>

                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            AI + HUMAN SECTION
        ====================================================== */}
        <section className="border-y border-white/5 bg-white/[.015] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid gap-12 lg:grid-cols-2 lg:items-center"
            >
              <motion.div variants={fadeLeft}>
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
                  Human + AI
                </span>

                <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                  AI assists the operator.
                  <br />
                  <span className="text-slate-500">
                    It does not replace them.
                  </span>
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-400">
                  MarineGuard is designed as a decision-support system.
                  Artificial intelligence helps surface potential targets,
                  while human operators retain control over interpretation
                  and final decisions.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/how-it-works")}
                  className="btn-secondary mt-8"
                >
                  Learn About The Workflow
                  <ArrowRight size={17} />
                </button>
              </motion.div>

              <motion.div
                variants={fadeRight}
                className="rounded-[2rem] border border-white/10 bg-white/[.025] p-7 sm:p-9"
              >
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                    <Eye size={23} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Operator Control
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      Human-in-the-loop analysis
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-4">
                  {principles.map((principle, index) => (
                    <motion.div
                      key={principle}
                      initial={{
                        opacity: 0,
                        x: 20,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: index * 0.08,
                      }}
                      className="flex gap-3"
                    >
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-cyan-300"
                      />

                      <span className="text-sm leading-6 text-slate-400">
                        {principle}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            TECHNOLOGY HIGHLIGHT
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
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
              amount: 0.2,
            }}
            transition={{
              duration: 0.7,
            }}
            className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[.07] to-transparent p-10 sm:p-14"
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -right-32 -top-32 h-80 w-80 rounded-full border border-cyan-300/10"
            />

            <motion.div
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-cyan-300/5"
            />

            <div className="relative z-10 max-w-3xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                <Zap size={24} />
              </div>

              <h2 className="mt-7 text-3xl font-semibold tracking-tight sm:text-5xl">
                Turning acoustic signals into
                <span className="text-cyan-300">
                  {" "}
                  actionable intelligence.
                </span>
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-400">
                MarineGuard brings together sonar data, AI detection,
                classification and geospatial information into one
                streamlined analysis experience.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="btn-primary mt-8"
              >
                Start Analysis
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}