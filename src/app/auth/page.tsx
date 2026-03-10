"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useKGStore, useMasteryStore } from "@/store/stores";
import { EXAMS } from "@/lib/data/exam-syllabi";
import { Sparkles, ArrowRight, ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";
type RegisterStep = "info" | "exam";

export default function AuthPage() {
    const router = useRouter();
    const { currentUser, register, login } = useAuthStore();
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<Mode>("login");
    const [step, setStep] = useState<RegisterStep>("info");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedExam, setSelectedExam] = useState("");

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (mounted && currentUser) router.push("/dashboard");
    }, [mounted, currentUser, router]);

    if (!mounted) return null;
    if (currentUser) return null;

    const handleLogin = () => {
        setError("");
        const result = login(email, password);
        if (!result.success) setError(result.error || "Login failed");
        else router.push("/dashboard");
    };

    const handleRegisterInfo = () => {
        if (!name.trim()) { setError("Name is required"); return; }
        if (!email.trim()) { setError("Email is required"); return; }
        if (password.length < 4) { setError("Password must be at least 4 characters"); return; }
        setError("");
        setStep("exam");
    };

    const handleRegisterExam = () => {
        if (!selectedExam) { setError("Please select an exam"); return; }
        setError("");
        // Clear old KG and mastery data so the new exam syllabus loads fresh
        useKGStore.getState().reset();
        useMasteryStore.getState().resetMastery();
        const result = register(name, email, password, selectedExam);
        if (!result.success) setError(result.error || "Registration failed");
        else router.push("/dashboard");
    };

    const switchMode = (m: Mode) => {
        setMode(m);
        setStep("info");
        setError("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            {/* Background glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(92,107,192,0.04) 0%, transparent 70%)" }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
                style={{ maxWidth: mode === "register" && step === "exam" ? 720 : 440 }}
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #5c6bc0, #7c4dff)", boxShadow: "0 4px 16px rgba(92, 107, 192, 0.25)" }}
                    >
                        <Sparkles className="w-5 h-5 text-white/90" />
                    </div>
                    <h1 className="text-2xl font-bold">
                        <span style={{ color: "var(--vm-text-primary)" }}>Vidya</span>
                        <span className="gradient-text">Mind</span>
                    </h1>
                    <p className="text-xs mt-1" style={{ color: "var(--vm-text-muted)" }}>Cognitive Learning OS</p>
                </div>

                {/* Card */}
                <div className="glass-card p-6 sm:p-8">
                    {/* Mode Tabs */}
                    <div className="flex rounded-lg overflow-hidden mb-8" style={{ background: "var(--vm-bg-primary)" }}>
                        {(["login", "register"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                className="flex-1 py-2.5 text-sm font-medium transition-all relative"
                                style={{
                                    color: mode === m ? "var(--vm-text-primary)" : "var(--vm-text-muted)",
                                    background: mode === m ? "var(--vm-accent-muted)" : "transparent",
                                }}
                            >
                                {m === "login" ? "Sign In" : "Create Account"}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* LOGIN */}
                        {mode === "login" && (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--vm-text-muted)" }}>Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--vm-text-faint)" }} />
                                        <input
                                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                                            style={{ background: "var(--vm-bg-primary)", border: "1px solid var(--vm-border)", color: "var(--vm-text-primary)" }}
                                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--vm-text-muted)" }}>Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--vm-text-faint)" }} />
                                        <input
                                            type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm focus:outline-none"
                                            style={{ background: "var(--vm-bg-primary)", border: "1px solid var(--vm-border)", color: "var(--vm-text-primary)" }}
                                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--vm-text-faint)" }}>
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <p className="text-xs" style={{ color: "var(--vm-danger)" }}>{error}</p>}

                                <motion.button
                                    whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(92, 107, 192, 0.3), 0 0 16px rgba(92, 107, 192, 0.08)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleLogin}
                                    className="w-full py-3 rounded-xl font-medium text-sm text-white/90 flex items-center justify-center gap-2"
                                    style={{ background: "linear-gradient(135deg, #5c6bc0, #7c4dff)", boxShadow: "0 2px 8px rgba(92, 107, 192, 0.2)" }}
                                >
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* REGISTER — Step 1: Info */}
                        {mode === "register" && step === "info" && (
                            <motion.div
                                key="register-info"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--vm-text-muted)" }}>Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--vm-text-faint)" }} />
                                        <input
                                            type="text" value={name} onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                                            style={{ background: "var(--vm-bg-primary)", border: "1px solid var(--vm-border)", color: "var(--vm-text-primary)" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--vm-text-muted)" }}>Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--vm-text-faint)" }} />
                                        <input
                                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                                            style={{ background: "var(--vm-bg-primary)", border: "1px solid var(--vm-border)", color: "var(--vm-text-primary)" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--vm-text-muted)" }}>Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--vm-text-faint)" }} />
                                        <input
                                            type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create password (4+ characters)"
                                            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm focus:outline-none"
                                            style={{ background: "var(--vm-bg-primary)", border: "1px solid var(--vm-border)", color: "var(--vm-text-primary)" }}
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--vm-text-faint)" }}>
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <p className="text-xs" style={{ color: "var(--vm-danger)" }}>{error}</p>}

                                <motion.button
                                    whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(92, 107, 192, 0.3), 0 0 16px rgba(92, 107, 192, 0.08)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleRegisterInfo}
                                    className="w-full py-3 rounded-xl font-medium text-sm text-white/90 flex items-center justify-center gap-2"
                                    style={{ background: "linear-gradient(135deg, #5c6bc0, #7c4dff)", boxShadow: "0 2px 8px rgba(92, 107, 192, 0.2)" }}
                                >
                                    Choose Your Exam <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* REGISTER — Step 2: Exam Selection */}
                        {mode === "register" && step === "exam" && (
                            <motion.div
                                key="register-exam"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.25 }}
                            >
                                <button onClick={() => setStep("info")} className="flex items-center gap-1.5 text-xs font-medium mb-5 transition-colors" style={{ color: "var(--vm-text-muted)" }}>
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                                </button>

                                <h3 className="text-base font-semibold mb-1" style={{ color: "var(--vm-text-primary)" }}>What are you preparing for?</h3>
                                <p className="text-xs mb-5" style={{ color: "var(--vm-text-muted)" }}>VidyaMind will personalize everything — syllabus, study plan, and AI tutoring — for your exam.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                    {EXAMS.map((exam) => (
                                        <motion.button
                                            key={exam.id}
                                            whileHover={{ y: -3 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setSelectedExam(exam.id)}
                                            className={`selection-card ${selectedExam === exam.id ? 'active' : ''}`}
                                            style={{
                                                background: selectedExam === exam.id ? "var(--vm-accent-muted)" : "var(--vm-bg-primary)",
                                                border: `1px solid ${selectedExam === exam.id ? "rgba(124, 140, 245, 0.2)" : "var(--vm-border)"}`,
                                                boxShadow: selectedExam === exam.id ? "0 4px 20px rgba(124, 140, 245, 0.1), 0 0 20px rgba(124, 140, 245, 0.06)" : "0 2px 8px rgba(0,0,0,0.15), 0 0 8px rgba(124,140,245,0.02)",
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{exam.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold" style={{ color: selectedExam === exam.id ? "var(--vm-accent)" : "var(--vm-text-primary)" }}>
                                                        {exam.name}
                                                    </p>
                                                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--vm-text-muted)" }}>
                                                        {exam.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--vm-bg-elevated)", color: "var(--vm-text-faint)" }}>
                                                            {exam.subjects.length} subjects
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--vm-bg-elevated)", color: "var(--vm-text-faint)" }}>
                                                            {new Date(exam.examDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedExam === exam.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                                        style={{ background: "var(--vm-accent)" }}
                                                    >
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                {error && <p className="text-xs mb-3" style={{ color: "var(--vm-danger)" }}>{error}</p>}

                                <motion.button
                                    whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(92, 107, 192, 0.3), 0 0 16px rgba(92, 107, 192, 0.08)" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleRegisterExam}
                                    disabled={!selectedExam}
                                    className="w-full py-3 rounded-xl font-medium text-sm text-white/90 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: "linear-gradient(135deg, #5c6bc0, #7c4dff)", boxShadow: "0 2px 8px rgba(92, 107, 192, 0.2)" }}
                                >
                                    Start Learning <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <p className="text-center mt-6 text-[11px]" style={{ color: "var(--vm-text-faint)" }}>
                    VidyaMind — Cognitive Learning OS
                </p>
            </motion.div>
        </div>
    );
}
