import {
  Eye,
  Globe2,
  ShieldCheck,
  Target,
  Waves,
  Users,
  Radar,
  BrainCircuit,
  MapPinned,
} from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import TiltedCard from "../components/ui/TiltedCard";

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

const cards = [
  {
    icon: Target,
    title: "Our Mission",
    text: "Make underwater survey intelligence faster, more structured and easier to act upon.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    text: "Create a future where important underwater hazards are easier to discover before they become larger environmental problems.",
  },
  {
    icon: ShieldCheck,
    title: "Safety First",
    text: "MarineGuard is designed around evidence-aware decisions instead of blindly treating every prediction as certain.",
  },
  {
    icon: Globe2,
    title: "Environmental Impact",
    text: "Support marine conservation, survey operations and cleanup planning with better intelligence.",
  },
];

const capabilities = [
  {
    icon: Radar,
    title: "Sonar Intelligence",
    text: "Transform complex side-scan sonar imagery into structured information that operators can review more efficiently.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Assisted Detection",
    text: "Use AI to identify known objects and highlight suspicious patterns that deserve additional investigation.",
  },
  {
    icon: MapPinned,
    title: "Location-Aware Results",
    text: "Connect findings with survey locations to support mapping, prioritization and future cleanup operations.",
  },
];

const creators = [
  {
    name: "Pratik Wani",
    role: "Team Lead",
    description:
      "Led the team, shaped MarineGuard's vision, and coordinated AI, backend, frontend, and product development.",
    photo: "/members/member1.png",
  },
  {
    name: "Aryan Mohite",
    role: "Product & Research",
    description:
      "Focused on product thinking, user experience, research, and shaping MarineGuard around real-world marine intelligence needs.",
    photo: "/members/member2.png",
  },
  {
    name: "Omkar Gaikwad",
    role: "Frontend Developer",
    description:
      "Designed and developed the MarineGuard experience with a focus on accessibility, simplicity, and a modern underwater interface.",
    photo: "/members/member3.png",
  },
  {
    name: "Moiz Shaikh",
    role: "AI/ML Engineer",
    description:
      "Worked on intelligent sonar analysis, detection patterns, and responsible AI features for underwater intelligence.",
    photo: "/members/member4.png",
  },
   {
    name: "Sharanya Mahalle",
    role: "Environmental Impact Analyst",
    description:
      "Analyzed the environmental impact of underwater survey operations and supported conservation efforts.",
    photo: "/members/member5.png",
  },
  {
    name: "Sejal Dhamgaye",
    role: "Documentation & Report",
    description:
      "Worked on documentation, report generation, and ensuring that MarineGuard's findings are clear and actionable.",
    photo: "/members/member6.png",
  },
];

export default function About() {
  return (
    <div className="min-h-screen overflow-hidden bg-ocean-950 text-white">
      <Navbar />

      <main>
        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <span className="eyebrow">
              <Waves size={13} />
              About MarineGuard AI
            </span>

            <h1 className="mt-7 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Intelligence for the{" "}
              <span className="text-cyan-300">
                underwater world.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-400">
              MarineGuard AI is an intelligent sonar analysis platform
              designed to transform difficult underwater acoustic imagery
              into useful operational information.
            </p>

            <p className="mt-5 max-w-3xl leading-7 text-slate-500">
              By combining sonar processing, AI-assisted detection,
              anomaly analysis and location-aware intelligence, MarineGuard
              helps survey teams understand what may be hidden beneath
              the surface.
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            className="grid gap-5 md:grid-cols-2"
          >
            {cards.map(({ icon: Icon, title, text }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.25 },
                }}
                className="group rounded-3xl border border-white/10 bg-white/[.035] p-8 transition-colors hover:border-cyan-300/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    size={25}
                    className="text-cyan-300"
                  />
                </div>

                <h2 className="mt-6 text-2xl font-semibold">
                  {title}
                </h2>

                <p className="mt-4 leading-7 text-slate-400">
                  {text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>
        
        <section className="border-y border-white/5 bg-white/[.02]">
          <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="max-w-4xl"
            >
              <span className="eyebrow">
                Why it matters
              </span>

              <h2 className="mt-5 max-w-4xl text-3xl font-semibold sm:text-5xl">
                Better information leads to better marine decisions.
              </h2>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                Sonar can reveal objects and structures that cannot be
                easily observed from the surface. The challenge is turning
                that acoustic information into something operators can
                efficiently review, understand and prioritize.
              </p>
            </motion.div>

            {/* Capability Cards */}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="mt-14 grid gap-5 lg:grid-cols-3"
            >
              {capabilities.map(
                ({ icon: Icon, title, text }) => (
                  <motion.div
                    key={title}
                    variants={fadeUp}
                    whileHover={{
                      y: -7,
                      scale: 1.01,
                      transition: { duration: 0.25 },
                    }}
                    className="rounded-2xl border border-white/10 bg-white/[.03] p-7 transition-colors hover:border-cyan-300/20"
                  >
                    <Icon
                      size={28}
                      className="text-cyan-300"
                    />

                    <h3 className="mt-6 text-xl font-semibold">
                      {title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {text}
                    </p>
                  </motion.div>
                )
              )}
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            MEET THE TEAM
        ====================================================== */}

        <section className="mx-auto mt-24 max-w-7xl px-5 pb-24 lg:px-8">
          {/* Section heading */}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mx-auto max-w-2xl text-center"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-sm">
                Meet the team
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl"
            >
              The young minds behind MarineGuard
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-3 leading-relaxed text-slate-400"
            >
              MarineGuard was brought to life by a team passionate
              about technology, artificial intelligence, marine
              environments, and building solutions that can make
              underwater exploration smarter.
            </motion.p>
          </motion.div>

          {/* Creator Cards */}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="mt-12 grid gap-6 sm:grid-cols-3"
          >
            {creators.map((creator) => (
              <motion.div
                key={creator.name}
                variants={fadeUp}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.25 },
                }}
                className="h-full"
              >
                <TiltedCard
                  rotateAmplitude={8}
                  scaleOnHover={1.035}
                  className="h-full"
                >
                  <div
                    className="
                      group
                      relative
                      h-full
                      overflow-hidden
                      rounded-3xl
                      border
                      border-cyan-300/10
                      bg-white/[.035]
                      p-6
                      backdrop-blur-xl
                      transition-all
                      duration-300
                      hover:border-cyan-300/25
                      hover:bg-cyan-300/[.04]
                      hover:shadow-2xl
                      hover:shadow-cyan-950/30
                    "
                  >
                    {/* Glow */}

                    <div
                      className="
                        pointer-events-none
                        absolute
                        -right-16
                        -top-16
                        h-40
                        w-40
                        rounded-full
                        bg-cyan-300/10
                        blur-3xl
                      "
                    />

                    {/* Photo */}

                    <motion.div
                      whileHover={{ scale: 1.015 }}
                      transition={{ duration: 0.4 }}
                      className="
                        relative
                        overflow-hidden
                        rounded-2xl
                        border
                        border-cyan-300/10
                        bg-gradient-to-br
                        from-cyan-300/10
                        via-ocean-900
                        to-ocean-950
                      "
                    >
                      <img
                        src={creator.photo}
                        alt={creator.name}
                        className="
                          h-54
                          w-full
                          object-cover
                          transition-transform
                          duration-700
                          group-hover:scale-105
                        "
                      />

                      {/* Image overlay */}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-950/70 via-transparent to-transparent" />

                      {/* Animated scan line */}

                      <motion.div
                        initial={{ y: "-100%" }}
                        whileHover={{ y: "100%" }}
                        transition={{
                          duration: 0.8,
                          ease: "easeInOut",
                        }}
                        className="
                          pointer-events-none
                          absolute
                          inset-x-0
                          h-20
                          bg-gradient-to-b
                          from-transparent
                          via-cyan-300/10
                          to-transparent
                        "
                      />
                    </motion.div>

                    {/* Creator information */}

                    <div className="relative mt-5 text-center">
                      <h3 className="text-xl font-semibold text-white">
                        {creator.name}
                      </h3>

                      <div
                        className="
                          mt-2
                          inline-flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          border-cyan-300/15
                          bg-cyan-300/10
                          px-3
                          py-1
                          text-xs
                          font-medium
                          text-cyan-300
                        "
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                        {creator.role}
                      </div>

                      <p className="mt-4 text-sm leading-7 text-slate-500">
                        {creator.description}
                      </p>
                    </div>
                  </div>
                </TiltedCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* =====================================================
            WHO IT SUPPORTS
        ====================================================== */}

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="eyebrow">
              Built for marine operations
            </span>

            <h2 className="mt-5 max-w-3xl text-3xl font-semibold sm:text-5xl">
              Designed around the people who work with the ocean.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
            className="mt-12 grid gap-5 md:grid-cols-3"
          >
            {[
              {
                icon: Users,
                title: "Survey Teams",
                text: "Support underwater surveys with faster access to relevant sonar findings.",
              },
              {
                icon: Globe2,
                title: "Conservation Teams",
                text: "Help identify potential environmental hazards and areas requiring attention.",
              },
              {
                icon: ShieldCheck,
                title: "Cleanup Operations",
                text: "Provide intelligence that can help teams prioritize potential cleanup targets.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{
                  y: -7,
                  transition: { duration: 0.25 },
                }}
                className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.025] p-7 transition-colors hover:border-cyan-300/20"
              >
                <Icon
                  size={27}
                  className="text-cyan-300"
                />

                <h3 className="mt-5 text-lg font-semibold">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}