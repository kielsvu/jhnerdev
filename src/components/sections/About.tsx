"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Code, Globe, ArrowUpRight } from "lucide-react";
import Image from "next/image";


const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.16,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 35 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: 70, rotate: 2 },
  show: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const pop: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 25 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};


export default function About() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateMobileState();
    window.addEventListener("resize", updateMobileState);

    return () => {
      window.removeEventListener("resize", updateMobileState);
    };
  }, []);

  const projectCount = 1
  const scrollToPortfolio = () => {
    const el = document.getElementById("portfolio");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isMobile === null) return null;

  const stats = [
    {
      icon: <Code size={16} />,
      value: String(projectCount),
      title: "PROJECTS",
    },
    {
      icon: <Code size={16} />,
      value: "23",
      title: "TECH STACK",
    },
    {
      icon: <Globe size={16} />,
      value: String(projectCount + 8),
      title: "COMPLETED WORKS",
    },
  ];

  return (
    <section
      id="about"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        padding: isMobile ? "60px 24px 30px" : "80px 60px 30px 120px",
      }}
    >
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-80px" }}
            style={{
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  letterSpacing: "0.2em",
                }}
              >
                ABOUT ME
              </span>
            </motion.div>

            <motion.div variants={fadeUp}>
              <div
                style={{
                  fontSize: isMobile ? 32 : "clamp(32px,5vw,46px)",
                  fontWeight: 800,
                  lineHeight: 1.03,
                  color: "var(--text-primary)",
                }}
              >
                <div>Jhner Torres</div>
              </div>
            </motion.div>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 1.1,
                    delay: 0.2,
                  },
                },
              }}
              style={{
                marginTop: 18,
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.75,
                maxWidth: isMobile ? "100%" : "490px",
              }}
            >
              I’m a senior high school student who picked up programming out of pure curiosity and never really stopped. I’ve been building websites for a couple of years now and I genuinely enjoy the process of turning an idea into something that actually works and looks good doing it.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.94 },
                show: {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    duration: 0.9,
                    delay: 0.3,
                  },
                },
              }}
              style={{
                marginTop: 18,
                padding: "12px 25px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                fontSize: 12,
                fontStyle: "italic",
                display: "inline-block",
                width: "fit-content",
              }}
            >
              “Still learning but building things that matter.”
            </motion.div>

            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                gap: 10,
                marginTop: 18,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={scrollToPortfolio}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid white",
                  background: "transparent",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "transform 0.25s ease, opacity 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-2px) scale(1.03)";
                  e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <ArrowUpRight size={14} />
                View Projects
              </button>
            </motion.div>
          </motion.div>

          <motion.div
              variants={slideLeft}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false }}
              style={{
                width: isMobile ? "100%" : "48%",
                display: "flex",
                justifyContent: isMobile ? "center" : "flex-end",
              }}
            >
              <div
                style={{
                  width: isMobile ? "min(264px, 68vw)" : 264,
                  height: isMobile ? "min(264px, 68vw)" : 264,
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  transform: isMobile ? "none" : "translateX(-80px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 55%, transparent 70%)",
                  boxShadow: "0 30px 90px rgba(255,255,255,0.05)",
                }}
              >
                <div
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onSelect={(e) => e.preventDefault()}
                  style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                    touchAction: "none",
                  }}
                >
                  <Image
                    src="/assets/PP.png"
                    alt="AJ"
                    width={264}
                    height={264}
                    priority
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    className="select-none"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              </div>
            </motion.div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false }}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 18,
            marginTop: 36,
          }}
        >
          {stats.map((item, i) => (
            <motion.div
              key={i}
              variants={pop}
              whileHover={{ scale: 1.03 }}
              style={{
                position: "relative",
                padding: 18,
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                {item.icon}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                }}
              >
                {item.title}
              </div>

              <div
                onClick={scrollToPortfolio}
                style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  cursor: "pointer",
                }}
              >
                <ArrowUpRight size={15} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
