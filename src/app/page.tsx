"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  BookOpen,
  BarChart3,
  Mic,
  Shield,
  ArrowRight,
  Globe,
  Target,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Knowledge Graph Tutoring",
    description: "Auto-generate concept maps from your syllabus. AI diagnoses learning gaps and gives Socratic step-by-step coaching.",
  },
  {
    icon: BarChart3,
    title: "Bayesian Mastery Tracking",
    description: "Real-time mastery tracking using Bayesian Knowledge Tracing. See exactly what you know and what needs work.",
  },
  {
    icon: BookOpen,
    title: "Rubric-Aware Grading",
    description: "Submit essays, code, or labs. Get criterion-by-criterion feedback with actionable improvement suggestions.",
  },
  {
    icon: Target,
    title: "Smart Spaced Repetition",
    description: "Exam-date-aware scheduling powered by SM-2+ algorithm. Know your readiness score and optimal study plan.",
  },
  {
    icon: Globe,
    title: "Multilingual Voice Interface",
    description: "Ask questions in Hindi. Full voice interaction with culturally-adapted explanations for Indian students.",
  },
  {
    icon: Shield,
    title: "Academic Integrity",
    description: "Originality scoring, citation suggestions, and writing style analysis. Builds integrity as a skill.",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Subtle ambient glow */}
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(92,107,192,0.04) 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,77,255,0.03) 0%, transparent 70%)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center max-w-4xl mx-auto z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-10 tracking-wide"
            style={{
              background: "var(--vm-accent-muted)",
              color: "var(--vm-accent)",
              border: "1px solid rgba(124, 140, 245, 0.1)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Learning Platform
          </motion.div>

          {/* Heading */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight mb-5"
            style={{ letterSpacing: "-0.03em" }}
          >
            <span style={{ color: "var(--vm-text-primary)" }}>Vidya</span>
            <span className="gradient-text">Mind</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl font-light mb-4 tracking-wide"
            style={{ color: "var(--vm-text-secondary)" }}
          >
            The Cognitive Learning Operating System
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--vm-text-muted)" }}
          >
            AI-powered personalized tutoring with knowledge graph diagnosis,
            Bayesian mastery tracking, rubric-aware grading, and multilingual
            voice â€” built for every student in India.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <Link href="/auth">
              <motion.button
                whileHover={{ y: -3, boxShadow: "0 8px 32px rgba(92, 107, 192, 0.3), 0 0 20px rgba(92, 107, 192, 0.1)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="btn-primary flex items-center gap-2"
              >
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/auth">
              <motion.button
                whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.2), 0 0 16px rgba(124,140,245,0.06)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="btn-secondary"
              >
                View Demo
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex items-center justify-center gap-12 sm:gap-16 mt-20"
          >
            {[
              { value: "5/5", label: "Exploration Paths" },
              { value: "BKT", label: "Mastery Algorithm" },
              { value: "10+", label: "Indian Languages" },
              { value: "< 3s", label: "Voice Response" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.08 }}
                whileHover={{ y: -3, scale: 1.05 }}
                className="text-center px-4 py-3 rounded-xl cursor-default"
                style={{ transition: "box-shadow 0.4s ease" }}
              >
                <div className="text-xl sm:text-2xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-[11px] mt-1 tracking-wide" style={{ color: "var(--vm-text-muted)" }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight" style={{ color: "var(--vm-text-primary)" }}>
              Every Learning Path, <span className="gradient-text">One Platform</span>
            </h2>
            <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "var(--vm-text-muted)" }}>
              VidyaMind integrates multiple learning paths into a unified
              cognitive learning experience powered by AI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="glass-card p-6 h-full cursor-default"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 icon-box"
                    style={{ background: "var(--vm-accent-muted)", boxShadow: "0 0 12px rgba(124,140,245,0.06)" }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: "var(--vm-accent)" }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--vm-text-primary)" }}>
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--vm-text-muted)" }}>
                    {feature.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-16 text-center tracking-tight"
            style={{ color: "var(--vm-text-primary)" }}
          >
            How It Works
          </motion.h2>

          <div className="space-y-10">
            {[
              { step: "01", title: "Upload Your Syllabus", desc: "Drop a PDF or paste your syllabus. VidyaMind auto-generates a knowledge graph of concepts with prerequisite chains." },
              { step: "02", title: "Learn with AI Tutor", desc: "Click any concept on the graph. The Socratic AI tutor guides you with hints, questions, and culturally-adapted analogies." },
              { step: "03", title: "Track Your Mastery", desc: "Bayesian Knowledge Tracing updates your mastery in real-time. See your exam readiness score and optimized study schedule." },
              { step: "04", title: "Get Graded & Improve", desc: "Submit essays or code for rubric-decomposed feedback. Academic integrity tools help you cite properly." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-6"
              >
                <motion.div
                  whileHover={{ y: -2, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold step-badge"
                >
                  {item.step}
                </motion.div>
                <div>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--vm-text-primary)" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--vm-text-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link href="/auth">
              <motion.button
                whileHover={{ y: -3, boxShadow: "0 8px 32px rgba(92, 107, 192, 0.3), 0 0 20px rgba(92, 107, 192, 0.1)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="btn-primary"
              >
                Get Started Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: "1px solid var(--vm-border)" }}>
        <p className="text-xs" style={{ color: "var(--vm-text-muted)" }}>
          VidyaMind — The Cognitive Learning Operating System Â·{" "}
          <span className="gradient-text font-medium">AI in Education & Skilling</span>
        </p>
      </footer>
    </div>
  );
}

