import {
  ArrowRight,
  CheckCircle2,
  Waves,
  Zap,
  ScanSearch,
  BrainCircuit,
  MapPinned,
  ShieldCheck,
  Ship,
  Radio,
  Database,
  Activity,
  Target,
  FileSearch,
  Gauge,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 30,
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

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const capabilities = [
  {
    icon: ScanSearch,
    title: "Underwater Object Detection",
    description:
      "Identify known marine objects and suspicious structures from side-scan sonar imagery using AI-assisted detection.",
  },
  {
    icon: BrainCircuit,
    title: "AI Sonar Analysis",
    description:
      "Transform complex acoustic imagery into structured intelligence that helps operators understand what lies beneath.",
  },
  {
    icon: MapPinned,
    title: "Geospatial Intelligence",
    description:
      "Connect detections with geographic information to understand where underwater objects and anomalies are located.",
  },
  {
    icon: ShieldCheck,
    title: "Risk-Aware Insights",
    description:
      "Classify detected objects and anomalies to support safer marine surveys and informed operational decisions.",
  },
];

const detectionTypes = [
  {
    icon: Database,
    title: "Marine Debris",
    description:
      "Locate underwater waste, discarded objects and other debris that may impact marine environments.",
  },
  {
    icon: Radio,
    title: "Ghost Nets",
    description:
      "Detect abandoned fishing equipment and submerged net structures that can threaten marine ecosystems.",
  },
  {
    icon: Ship,
    title: "Shipwrecks",
    description:
      "Identify potential wreck structures and unusual sonar signatures associated with submerged vessels.",
  },
  {
    icon: Activity,
    title: "Sonar Anomalies",
    description:
      "Surface unusual acoustic patterns that may require further inspection or investigation.",
  },
];

const workflow = [
  {
    number: "01",
    icon: FileSearch,
    title: "Upload Sonar Data",
    description:
      "Upload side-scan sonar imagery from your marine survey or underwater inspection.",
  },
  {
    number: "02",
    icon: BrainCircuit,
    title: "AI Processes the Image",
    description:
      "MarineGuard analyzes the sonar frame and searches for recognizable objects and anomalous signatures.",
  },
  {
    number: "03",
    icon: Target,
    title: "Review Detections",
    description:
      "Inspect detected objects, confidence information, classifications and relevant spatial details.",
  },
  {
    number: "04",
    icon: Gauge,
    title: "Make Better Decisions",
    description:
      "Use structured intelligence to prioritize investigations and improve marine survey operations.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-ocean-950 text-white">
      <Navbar />

      <main>
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative min-h-[720px] overflow-hidden pb-20 pt-36 lg:pt-44">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4"
          />

          <div className="absolute inset-0 bg-ocean-950/20" />

          <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/70 via-ocean-950/30 to-transparent" />

          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ocean-950/50 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ocean-950" />

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8"
          >
            <div className="max-w-4xl">
              <motion.span variants={fadeUp} className="eyebrow">
                <Waves size={13} />
                Side-scan sonar intelligence
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-.04em] text-white sm:text-7xl"
              >
                See What Lies
                <br />
                <span className="text-cyan-300">Beneath.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-2xl text-lg leading-8 text-slate-300"
              >
                MarineGuard AI transforms side-scan sonar imagery into
                actionable marine intelligence. Detect underwater debris,
                ghost nets, shipwrecks and suspicious anomalies faster.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-9 flex flex-wrap gap-3"
              >
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="btn-primary"
                >
                  Analyze Sonar
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/about")}
                  className="btn-secondary"
                >
                  Explore MarineGuard
                </button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyan-300" />
                  Safety-aware decisions
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyan-300" />
                  Geotag-ready
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-cyan-300" />
                  AI-assisted analysis
                </span>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* =====================================================
            INTRO / PLATFORM VALUE
        ====================================================== */}
        <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center"
          >
            <div>
              <motion.span
                variants={fadeUp}
                className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300"
              >
                Marine Intelligence
              </motion.span>

              <motion.h2
                variants={fadeUp}
                className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl"
              >
                From raw sonar imagery
                <span className="text-cyan-300"> to useful intelligence.</span>
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-400"
              >
                Underwater environments are difficult to inspect. Large
                volumes of sonar imagery can contain valuable information
                that is difficult and time-consuming to interpret manually.
              </motion.p>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-2xl text-lg leading-8 text-slate-400"
              >
                MarineGuard AI provides an intelligent analysis layer that
                helps transform sonar frames into structured detections,
                classifications and spatial insights.
              </motion.p>
            </div>

            <motion.div
              variants={fadeUp}
              className="grid grid-cols-2 gap-4"
            >
              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
                <Waves className="text-cyan-300" size={28} />
                <p className="mt-5 text-3xl font-semibold">Sonar</p>
                <p className="mt-2 text-sm text-slate-500">
                  Acoustic imagery
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
                <BrainCircuit className="text-cyan-300" size={28} />
                <p className="mt-5 text-3xl font-semibold">AI</p>
                <p className="mt-2 text-sm text-slate-500">
                  Assisted interpretation
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
                <MapPinned className="text-cyan-300" size={28} />
                <p className="mt-5 text-3xl font-semibold">Geo</p>
                <p className="mt-2 text-sm text-slate-500">
                  Spatial intelligence
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6">
                <ShieldCheck className="text-cyan-300" size={28} />
                <p className="mt-5 text-3xl font-semibold">Risk</p>
                <p className="mt-2 text-sm text-slate-500">
                  Safety-aware insights
                </p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* =====================================================
            CAPABILITIES
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
                Core Capabilities
              </motion.span>

              <motion.h2
                variants={fadeUp}
                className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                Intelligence built for the underwater environment.
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-5 text-lg leading-8 text-slate-400"
              >
                MarineGuard combines computer vision, sonar interpretation
                and geospatial context to simplify underwater analysis.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
              className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
            >
              {capabilities.map((item) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className="group rounded-3xl border border-white/10 bg-white/[.035] p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-cyan-300/[.04]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-6 text-xl font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            WHAT CAN BE DETECTED
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
              What MarineGuard Can Find
            </motion.span>

            <motion.h2
              variants={fadeUp}
              className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              Turn underwater signatures into recognizable objects.
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400"
            >
              Analyze sonar imagery for potential objects and anomalies that
              deserve attention during marine surveys.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            className="mt-14 grid gap-5 md:grid-cols-2"
          >
            {detectionTypes.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[.045] to-white/[.015] p-8"
                >
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-300/5 blur-3xl" />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                        <Icon size={23} />
                      </div>

                      <span className="text-xs font-medium tracking-[0.2em] text-slate-600">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-7 text-2xl font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-3 max-w-lg leading-7 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* =====================================================
            HOW IT WORKS
        ====================================================== */}
        <section className="border-y border-white/5 bg-white/[.015] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
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
                Simple Workflow
              </motion.span>

              <motion.h2
                variants={fadeUp}
                className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                From sonar frame to decision.
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400"
              >
                MarineGuard keeps the analysis workflow simple so operators
                can spend less time manually reviewing imagery.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
              className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
              {workflow.map((item) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.number}
                    variants={fadeUp}
                    className="relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/5 text-cyan-300">
                        <Icon size={22} />
                      </div>

                      <span className="text-sm font-semibold tracking-[0.2em] text-slate-700">
                        {item.number}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            WHY MARINEGUARD
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-12 lg:grid-cols-2 lg:items-center"
          >
            <div>
              <motion.span
                variants={fadeUp}
                className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300"
              >
                Why MarineGuard
              </motion.span>

              <motion.h2
                variants={fadeUp}
                className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                Make underwater surveys more intelligent.
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg leading-8 text-slate-400"
              >
                Marine environments are vast, complex and difficult to
                inspect. MarineGuard is designed to help survey teams
                organize sonar information and focus attention where it
                matters most.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 space-y-4">
                {[
                  "Reduce manual sonar image inspection",
                  "Surface potential underwater objects faster",
                  "Connect detections with geographic context",
                  "Create structured analysis results",
                  "Support safer marine survey decisions",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-cyan-300"
                    />
                    <span>{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-cyan-300/[.035] p-8 sm:p-10"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                    <Activity size={22} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Analysis Pipeline
                    </p>
                    <p className="font-medium text-white">
                      Active Intelligence Layer
                    </p>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  {[
                    ["Sonar Input", "Raw acoustic imagery"],
                    ["AI Detection", "Objects & anomalies"],
                    ["Classification", "Structured results"],
                    ["Geo Context", "Location intelligence"],
                    ["Decision Support", "Actionable insights"],
                  ].map(([title, description], index) => (
                    <div
                      key={title}
                      className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/10 p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-semibold text-cyan-300">
                        {index + 1}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">
                          {title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* =====================================================
            USE CASES
        ====================================================== */}
        <section className="border-y border-white/5 bg-white/[.015] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
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
                Built For Marine Operations
              </motion.span>

              <motion.h2
                variants={fadeUp}
                className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                One intelligence layer. Multiple applications.
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
              className="mt-14 grid gap-5 md:grid-cols-3"
            >
              {[
                {
                  title: "Marine Surveys",
                  description:
                    "Assist survey teams in reviewing large collections of side-scan sonar imagery.",
                  icon: Waves,
                },
                {
                  title: "Environmental Monitoring",
                  description:
                    "Help identify submerged debris and abandoned fishing equipment affecting marine environments.",
                  icon: ShieldCheck,
                },
                {
                  title: "Underwater Inspection",
                  description:
                    "Support inspection teams by highlighting objects and anomalies that may require closer examination.",
                  icon: ScanSearch,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className="rounded-3xl border border-white/10 bg-white/[.035] p-8"
                  >
                    <Icon size={28} className="text-cyan-300" />

                    <h3 className="mt-6 text-xl font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-3 leading-7 text-slate-500">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            FINAL CTA
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-5 pb-28 pt-24 lg:px-8">
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.97,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.7,
            }}
            className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[.055] p-10 text-center sm:p-14"
          >
            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative z-10">
              <motion.div
                initial={{
                  rotate: -10,
                  scale: 0.8,
                }}
                whileInView={{
                  rotate: 0,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.5,
                }}
              >
                <Zap
                  size={30}
                  className="mx-auto text-cyan-300"
                />
              </motion.div>

              <h2 className="mt-5 text-3xl font-semibold text-white sm:text-5xl">
                Start exploring the underwater world.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-slate-400">
                Upload sonar data and turn acoustic imagery into actionable
                marine intelligence.
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