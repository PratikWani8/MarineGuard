import {
  Anchor,
  ArrowRight,
  Globe2,
  MapPin,
  Recycle,
  ShieldAlert,
  Waves,
  Zap,
  Fish,
  Search,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const impacts = [
  {
    icon: Zap,
    title: "Faster Sonar Analysis",
    text: "Reduce repetitive manual inspection and help operators focus attention on important findings.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Prioritization",
    text: "Surface suspicious and high-risk findings that may require additional investigation.",
  },
  {
    icon: Recycle,
    title: "Cleanup Planning",
    text: "Help conservation teams identify areas that may benefit from targeted cleanup missions.",
  },
  {
    icon: MapPin,
    title: "Localized Intelligence",
    text: "Associate findings with survey locations for better operational planning.",
  },
  {
    icon: Globe2,
    title: "Marine Conservation",
    text: "Support broader efforts to understand and protect underwater environments.",
  },
  {
    icon: Anchor,
    title: "Survey Operations",
    text: "Provide structured information that can support underwater survey workflows.",
  },
];

const missionSteps = [
  {
    icon: Search,
    title: "Discover",
    text: "Find objects, debris and suspicious underwater patterns.",
  },
  {
    icon: ShieldAlert,
    title: "Prioritize",
    text: "Highlight findings that may require closer investigation.",
  },
  {
    icon: Users,
    title: "Coordinate",
    text: "Give teams structured information for planning and review.",
  },
  {
    icon: Recycle,
    title: "Act",
    text: "Support targeted conservation and cleanup operations.",
  },
];

export default function Impact() {
  return (
    <div className="bg-ocean-950 text-white">
        <Navbar />
      {/* =====================================================
          INTRO
      ====================================================== */}

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
            <Globe2 size={13} />
            Real-world impact
          </span>

          <h2 className="mt-7 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            From sonar findings to{" "}
            <span className="text-cyan-300">
              marine action.
            </span>
          </h2>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-400">
            MarineGuard AI is designed to help conservation teams,
            survey operators and cleanup missions make better use of
            underwater acoustic data.
          </p>

          <p className="mt-5 max-w-3xl leading-7 text-slate-500">
            The goal is not simply to detect objects. It is to turn
            difficult sonar information into structured intelligence
            that can help teams understand risks, prioritize findings
            and plan their next action.
          </p>
        </motion.div>
      </section>

      {/* =====================================================
          IMPACT CARDS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-32">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {impacts.map(
            ({ icon: Icon, title, text }, index) => (
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
                  amount: 0.15,
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.08,
                }}
                whileHover={{
                  y: -8,
                  scale: 1.01,
                }}
                className="group glass rounded-3xl p-7 transition-colors hover:border-cyan-300/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    size={26}
                    className="text-cyan-300"
                  />
                </div>

                <h3 className="mt-6 text-xl font-semibold">
                  {title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-400">
                  {text}
                </p>
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* =====================================================
          BIGGER PICTURE
      ====================================================== */}

      <section className="border-y border-white/5 bg-white/[.02]">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <motion.div
              initial={{
                opacity: 0,
                x: -40,
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
                duration: 0.7,
              }}
            >
              <span className="eyebrow">
                <Waves size={13} />
                The bigger picture
              </span>

              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
                Better visibility can lead to better priorities.
              </h2>

              <p className="mt-6 leading-8 text-slate-400">
                Underwater environments contain complex combinations
                of natural and artificial structures. MarineGuard AI
                aims to help teams organize this information so
                potential hazards and anomalies can receive
                appropriate attention.
              </p>

              <p className="mt-5 leading-7 text-slate-500">
                By connecting detection, anomaly analysis and
                location-aware information, the platform can provide
                a clearer starting point for human review and
                operational planning.
              </p>
            </motion.div>

            {/* Right */}
            <motion.div
              initial={{
                opacity: 0,
                x: 40,
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
                duration: 0.7,
              }}
              className="rounded-3xl border border-cyan-300/10 bg-cyan-300/[.03] p-8"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{
                    rotate: 8,
                    scale: 1.08,
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10"
                >
                  <Recycle className="text-cyan-300" />
                </motion.div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-300/60">
                    Mission focus
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">
                    Discover. Prioritize. Act.
                  </h3>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {missionSteps.map(
                  (
                    { icon: Icon, title, text },
                    index
                  ) => (
                    <motion.div
                      key={title}
                      initial={{
                        opacity: 0,
                        x: 15,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: index * 0.12,
                      }}
                      whileHover={{
                        x: 5,
                      }}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.02] p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10">
                        <Icon
                          size={17}
                          className="text-cyan-300"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {text}
                        </p>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHO BENEFITS
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
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
        >
          <span className="eyebrow">
            Marine ecosystem
          </span>

          <h2 className="mt-5 max-w-3xl text-3xl font-semibold sm:text-5xl">
            Supporting the teams working to understand and protect
            our oceans.
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Fish,
              title: "Marine Conservation",
              text: "Support efforts to understand underwater environments and potential hazards.",
            },
            {
              icon: Anchor,
              title: "Survey Operations",
              text: "Help survey teams organize and review large volumes of sonar information.",
            },
            {
              icon: Recycle,
              title: "Cleanup Missions",
              text: "Provide intelligence that can help prioritize potential cleanup targets.",
            },
          ].map(
            ({ icon: Icon, title, text }, index) => (
              <motion.div
                key={title}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                whileInView={{
                  opacity: 1,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: index * 0.1,
                }}
                whileHover={{
                  y: -7,
                }}
                className="rounded-2xl border border-white/10 bg-white/[.03] p-7"
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
            )
          )}
        </div>
      </section>

      {/* =====================================================
          TECHNOLOGY LINK / NEXT SECTION
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 pb-28 lg:px-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
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
          className="rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[.055] p-10 text-center sm:p-14"
        >
          <h2 className="text-3xl font-semibold sm:text-5xl">
            Explore the technology behind MarineGuard.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Learn how the platform combines known-object detection,
            anomaly analysis and safety-aware intelligence.
          </p>

          <a
            href="#technology"
            className="btn-primary mt-8"
          >
            Explore Technology
            <ArrowRight size={18} />
          </a>
        </motion.div>
      </section>
      <Footer />
    </div>
  );
}
