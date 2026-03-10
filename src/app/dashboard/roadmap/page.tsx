"use client";

import { useKGStore, useMasteryStore } from "@/store/stores";
import { useAuthStore } from "@/store/auth-store";
import { getExamById } from "@/lib/data/exam-syllabi";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ChevronDown, BookOpen, GraduationCap, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import Link from "next/link";

/* ── Heatmap palette ── */
function heatColor(m: number): string {
    if (m >= 0.85) return "#22d3ee";
    if (m >= 0.65) return "#34d399";
    if (m >= 0.4) return "#fbbf24";
    if (m >= 0.15) return "#f87171";
    return "#94a3b8";
}

/* ── Subject card palettes (light, vibrant) ── */
const PALETTES: Record<string, { bg: string; glow: string; accent: string; text: string }> = {
    Physics: { bg: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", glow: "rgba(99,102,241,0.22)", accent: "#6366f1", text: "#312e81" },
    Chemistry: { bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", glow: "rgba(16,185,129,0.22)", accent: "#10b981", text: "#064e3b" },
    Biology: { bg: "linear-gradient(135deg, #fce7f3, #fbcfe8)", glow: "rgba(236,72,153,0.22)", accent: "#ec4899", text: "#831843" },
    Mathematics: { bg: "linear-gradient(135deg, #fef3c7, #fde68a)", glow: "rgba(245,158,11,0.22)", accent: "#f59e0b", text: "#78350f" },
    "Physical Chemistry": { bg: "linear-gradient(135deg, #e0f2fe, #bae6fd)", glow: "rgba(14,165,233,0.22)", accent: "#0ea5e9", text: "#0c4a6e" },
    "Inorganic Chemistry": { bg: "linear-gradient(135deg, #f0fdf4, #bbf7d0)", glow: "rgba(34,197,94,0.22)", accent: "#22c55e", text: "#14532d" },
    "Organic Chemistry": { bg: "linear-gradient(135deg, #fdf4ff, #f5d0fe)", glow: "rgba(168,85,247,0.22)", accent: "#a855f7", text: "#581c87" },
    "English Language": { bg: "linear-gradient(135deg, #fff7ed, #fed7aa)", glow: "rgba(249,115,22,0.22)", accent: "#f97316", text: "#7c2d12" },
    "Current Affairs and General Knowledge": { bg: "linear-gradient(135deg, #ecfdf5, #a7f3d0)", glow: "rgba(16,185,129,0.22)", accent: "#10b981", text: "#064e3b" },
    "Legal Reasoning": { bg: "linear-gradient(135deg, #eff6ff, #bfdbfe)", glow: "rgba(59,130,246,0.22)", accent: "#3b82f6", text: "#1e3a5f" },
    "Logical Reasoning": { bg: "linear-gradient(135deg, #faf5ff, #e9d5ff)", glow: "rgba(139,92,246,0.22)", accent: "#8b5cf6", text: "#4c1d95" },
    "Quantitative Techniques": { bg: "linear-gradient(135deg, #fff1f2, #fecdd3)", glow: "rgba(244,63,94,0.22)", accent: "#f43f5e", text: "#881337" },
};
const DEF_PAL = { bg: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", glow: "rgba(99,102,241,0.22)", accent: "#6366f1", text: "#312e81" };
function pal(s: string) { return PALETTES[s] || DEF_PAL; }

/* ── Constants ── */
const COL_WIDTH = 300;
const COL_GAP = 32;
const MIN_SCALE = 0.35;
const MAX_SCALE = 1.6;

export default function RoadmapPage() {
    const { knowledgeGraph } = useKGStore();
    const { mastery } = useMasteryStore();
    const { currentUser } = useAuthStore();
    const exam = currentUser?.selectedExam ? getExamById(currentUser.selectedExam) : null;

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    /* ── Pan / Zoom state ── */
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [cam, setCam] = useState({ x: 0, y: 0, scale: 1 });
    const camRef = useRef({ x: 0, y: 0, scale: 1 });
    const [initialCentered, setInitialCentered] = useState(false);
    const isDragging = useRef(false);
    const dragOrigin = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

    // Keep camRef in sync when cam state changes (for programmatic updates)
    useEffect(() => { camRef.current = cam; }, [cam]);

    // Compute header opacity based on content proximity
    const updateHeaderOpacity = useCallback((c: { x: number; y: number; scale: number }) => {
        if (!headerRef.current) return;
        // The content's first visible element starts at paddingTop (80px) in content coords
        const contentTopInViewport = c.y + 80 * c.scale;
        // Header zone is roughly 0-60px from top. Fade when content enters 60-100px zone.
        const fadeStart = 100; // content top below this = fully visible header
        const fadeEnd = 50;    // content top below this = fully hidden header
        const opacity = contentTopInViewport >= fadeStart ? 1
            : contentTopInViewport <= fadeEnd ? 0
                : (contentTopInViewport - fadeEnd) / (fadeStart - fadeEnd);
        headerRef.current.style.opacity = String(opacity);
    }, []);

    // Apply transform directly to DOM — avoids React re-render
    const applyTransform = useCallback((c: { x: number; y: number; scale: number }, animate: boolean) => {
        if (!contentRef.current) return;
        contentRef.current.style.transition = animate
            ? "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)"
            : "none";
        contentRef.current.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.scale})`;
        updateHeaderOpacity(c);
    }, [updateHeaderOpacity]);

    // Also update header on React state-driven cam changes (zoom, toggle)
    useEffect(() => { updateHeaderOpacity(cam); }, [cam, updateHeaderOpacity]);

    const subjects = useMemo(() => {
        if (!exam) return [];
        return exam.concepts.map((section) => {
            let totalM = 0;
            const topics = section.topics.map((t) => {
                const id = t.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
                const m = mastery[id]?.mastery || 0;
                totalM += m;
                return { id, name: t, mastery: m };
            });
            return {
                name: section.subject,
                topics,
                avgMastery: topics.length ? totalM / topics.length : 0,
                mastered: topics.filter((t) => t.mastery >= 0.85).length,
                total: topics.length,
            };
        });
    }, [exam, mastery]);

    const CONTENT_PAD_LEFT = 0; // We'll center via transform, no padding offset needed
    const contentWidth = subjects.length * COL_WIDTH + (subjects.length - 1) * COL_GAP;

    /* ── Center on initial load ── */
    useEffect(() => {
        if (initialCentered || !viewportRef.current || subjects.length === 0) return;
        const vw = viewportRef.current.clientWidth;
        const offsetX = (vw - contentWidth) / 2;
        const newCam = { x: offsetX, y: 30, scale: 1 };
        setCam(newCam);
        applyTransform(newCam, false);
        setInitialCentered(true);
    }, [initialCentered, subjects.length, contentWidth, applyTransform]);

    /* ── Toggle with auto-zoom ── */
    const toggle = useCallback((subject: string) => {
        setExpanded((prev) => {
            const next = { ...prev, [subject]: !prev[subject] };

            // Auto-zoom after state update
            requestAnimationFrame(() => {
                if (!viewportRef.current) return;
                const vw = viewportRef.current.clientWidth;
                const vh = viewportRef.current.clientHeight;

                const expandedSubjects = Object.entries(next).filter(([, v]) => v).map(([k]) => k);

                if (expandedSubjects.length === 0) {
                    // Reset to centered view
                    const offsetX = (vw - contentWidth) / 2;
                    setCam({ x: offsetX, y: 30, scale: 1 });
                    return;
                }

                // Find indices of expanded subjects
                const indices = expandedSubjects.map((s) =>
                    subjects.findIndex((sub) => sub.name === s)
                ).filter((i) => i !== -1);

                if (indices.length === 0) return;

                const minIdx = Math.min(...indices);
                const maxIdx = Math.max(...indices);

                // Calculate the center of the expanded column range
                const leftEdge = minIdx * (COL_WIDTH + COL_GAP);
                const rightEdge = maxIdx * (COL_WIDTH + COL_GAP) + COL_WIDTH;
                const centerX = (leftEdge + rightEdge) / 2;

                // For single column: zoom in closer; for multiple: fit them all
                const spanWidth = rightEdge - leftEdge + 120;
                let targetScale: number;
                if (indices.length === 1) {
                    // Single subject: slightly zoomed in, centered on that column
                    targetScale = Math.min(vw / (COL_WIDTH + 160), 0.95);
                } else {
                    // Multiple subjects: fit them with padding
                    targetScale = Math.min(
                        Math.max(vw / spanWidth, MIN_SCALE),
                        0.85
                    );
                }

                // Center the expanded column(s) in the viewport
                const offsetX = vw / 2 - centerX * targetScale;
                // Small Y shift to show topics below the parent card
                const offsetY = -20;

                const newCam = { x: offsetX, y: offsetY, scale: targetScale };
                setCam(newCam);
                applyTransform(newCam, true);
            });

            return next;
        });
    }, [subjects, contentWidth]);

    /* ── Mouse drag for panning (direct DOM manipulation, zero re-renders) ── */
    const onPointerDown = useCallback((e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest("a, button")) return;
        isDragging.current = true;
        const c = camRef.current;
        dragOrigin.current = { mx: e.clientX, my: e.clientY, cx: c.x, cy: c.y };
        // Kill any CSS transition immediately for instant feedback
        if (contentRef.current) contentRef.current.style.transition = "none";
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragOrigin.current.mx;
        const dy = e.clientY - dragOrigin.current.my;
        const s = camRef.current.scale;
        const maxPan = contentWidth * s;
        const newX = Math.max(-maxPan, Math.min(maxPan, dragOrigin.current.cx + dx));
        const newY = Math.max(-1200, Math.min(600, dragOrigin.current.cy + dy));
        // Update ref (no React re-render)
        camRef.current = { ...camRef.current, x: newX, y: newY };
        // Apply directly to DOM
        applyTransform(camRef.current, false);
    }, [contentWidth, applyTransform]);

    const onPointerUp = useCallback(() => {
        if (!isDragging.current) return;
        isDragging.current = false;
        // Sync ref → state (single re-render)
        setCam({ ...camRef.current });
    }, []);

    /* ── Mouse wheel for zooming ── */
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            setCam((c) => ({
                ...c,
                scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, c.scale + delta)),
            }));
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    /* ── Zoom controls ── */
    const zoomIn = () => {
        const newCam = { ...camRef.current, scale: Math.min(MAX_SCALE, camRef.current.scale + 0.15) };
        setCam(newCam);
        applyTransform(newCam, true);
    };
    const zoomOut = () => {
        const newCam = { ...camRef.current, scale: Math.max(MIN_SCALE, camRef.current.scale - 0.15) };
        setCam(newCam);
        applyTransform(newCam, true);
    };
    const resetView = () => {
        if (!viewportRef.current) { setCam({ x: 0, y: 0, scale: 1 }); return; }
        const vw = viewportRef.current.clientWidth;
        const offsetX = (vw - contentWidth) / 2;
        const newCam = { x: offsetX, y: 30, scale: 1 };
        setCam(newCam);
        applyTransform(newCam, true);
    };

    if (!knowledgeGraph || !exam) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <GraduationCap className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--vm-text-faint)" }} />
                <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--vm-text-primary)" }}>No Exam Selected</h2>
                <p className="text-sm mb-6" style={{ color: "var(--vm-text-muted)" }}>Go to the dashboard to set up your exam.</p>
                <Link href="/dashboard">
                    <button className="px-6 py-3 rounded-xl font-medium text-sm text-white/90"
                        style={{ background: "linear-gradient(135deg, #5c6bc0, #7c4dff)" }}>
                        Go to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    const totalTopics = subjects.reduce((a, s) => a + s.total, 0);
    const overallM = totalTopics > 0 ? subjects.reduce((a, s) => a + s.avgMastery * s.total, 0) / totalTopics : 0;

    return (
        <div className="relative w-full" style={{ height: "calc(100vh - 40px)" }}>
            {/* ── Header overlay ── */}
            <div ref={headerRef} className="absolute top-4 left-0 right-0 z-10 text-center pointer-events-none"
                style={{ transition: "opacity 0.4s ease" }}
            >
                <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--vm-text-primary)" }}>
                    Exam Roadmap
                </h1>
                <p className="text-xs mt-0.5 tracking-wide" style={{ color: "var(--vm-text-muted)" }}>
                    {exam.icon} {exam.name} · scroll to zoom · drag to pan
                </p>
            </div>

            {/* ── Zoom controls ── */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
                {[
                    { icon: ZoomIn, fn: zoomIn, label: "Zoom in" },
                    { icon: ZoomOut, fn: zoomOut, label: "Zoom out" },
                    { icon: Maximize2, fn: resetView, label: "Reset" },
                ].map((btn) => (
                    <button
                        key={btn.label}
                        onClick={btn.fn}
                        title={btn.label}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "var(--vm-text-muted)",
                        }}
                    >
                        <btn.icon className="w-3.5 h-3.5" />
                    </button>
                ))}
            </div>

            {/* ── Heatmap Legend ── */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-5 px-4 py-2 rounded-xl"
                style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--vm-text-faint)" }}>Mastery</span>
                {[
                    { l: "New", c: "#94a3b8" }, { l: "Struggling", c: "#f87171" },
                    { l: "Learning", c: "#fbbf24" }, { l: "Proficient", c: "#34d399" }, { l: "Mastered", c: "#22d3ee" },
                ].map((i) => (
                    <div key={i.l} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: i.c, boxShadow: `0 0 6px ${i.c}55` }} />
                        <span className="text-[9px]" style={{ color: "var(--vm-text-muted)" }}>{i.l}</span>
                    </div>
                ))}
            </div>

            {/* ── Pannable / Zoomable Viewport ── */}
            <div
                ref={viewportRef}
                className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                {/* ── Transformable Content ── */}
                <div
                    ref={contentRef}
                    className="origin-top-left will-change-transform"
                    style={{
                        transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
                        transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                        width: contentWidth,
                        paddingTop: 80,
                        paddingBottom: 200,
                    }}
                >
                    {/* ── Root Exam Node ── */}
                    <div className="flex justify-center mb-4" style={{ width: contentWidth }}>
                        <div
                            className="px-10 py-4 rounded-2xl text-center"
                            style={{
                                background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
                                border: "1px solid rgba(255,255,255,0.1)",
                                boxShadow: "0 4px 32px rgba(124,77,255,0.1)",
                            }}
                        >
                            <p className="text-lg font-bold" style={{ color: "var(--vm-text-primary)" }}>
                                {exam.icon} {exam.name}
                            </p>
                            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--vm-accent)" }}>
                                {Math.round(overallM * 100)}% mastery · {totalTopics} chapters
                            </p>
                        </div>
                    </div>

                    {/* ── Vertical connector ── */}
                    <div className="flex justify-center" style={{ width: contentWidth }}>
                        <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, rgba(124,140,245,0.25), rgba(124,140,245,0.06))" }} />
                    </div>

                    {/* ── Horizontal connector ── */}
                    {subjects.length > 1 && (
                        <div className="relative" style={{ width: contentWidth, height: 1 }}>
                            <div className="absolute h-px" style={{
                                left: COL_WIDTH / 2,
                                right: COL_WIDTH / 2,
                                background: "rgba(124,140,245,0.12)",
                            }} />
                        </div>
                    )}

                    {/* ── Subject Columns (fixed-width, no shrinking) ── */}
                    <div className="flex" style={{ gap: COL_GAP, width: contentWidth }}>
                        {subjects.map((subj, sIdx) => {
                            const isOpen = expanded[subj.name] || false;
                            const p = pal(subj.name);

                            return (
                                <div key={subj.name} className="flex flex-col items-center" style={{ width: COL_WIDTH, flexShrink: 0 }}>
                                    {/* Vertical stem to subject */}
                                    <div className="w-px h-6" style={{ background: "rgba(124,140,245,0.12)" }} />

                                    {/* ── Parent Card (Light) ── */}
                                    <motion.button
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: sIdx * 0.1, type: "spring", stiffness: 180, damping: 18 }}
                                        whileHover={{ y: -6, scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => toggle(subj.name)}
                                        className="relative overflow-hidden cursor-pointer"
                                        style={{
                                            width: COL_WIDTH,
                                            borderRadius: 20,
                                            padding: "22px 20px 18px",
                                            textAlign: "center" as const,
                                            background: p.bg,
                                            boxShadow: `0 8px 36px ${p.glow}, 0 2px 12px ${p.glow}`,
                                            border: "none",
                                            transition: "box-shadow 0.4s ease",
                                        }}
                                    >
                                        {/* Top accent */}
                                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: p.accent }} />

                                        <p className="text-sm font-extrabold tracking-wide mt-1" style={{ color: p.text }}>
                                            {subj.name}
                                        </p>
                                        <p className="text-3xl font-black mt-2 mb-2" style={{ color: p.accent }}>
                                            {Math.round(subj.avgMastery * 100)}%
                                        </p>

                                        {/* Progress bar */}
                                        <div className="w-3/4 mx-auto h-1.5 rounded-full overflow-hidden mb-2"
                                            style={{ background: `${p.accent}22` }}>
                                            <motion.div className="h-full rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(subj.avgMastery * 100, 2)}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                style={{ background: p.accent }}
                                            />
                                        </div>

                                        <p className="text-[10px] font-semibold" style={{ color: `${p.text}99` }}>
                                            {subj.mastered}/{subj.total} mastered
                                        </p>

                                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}
                                            className="mt-2 mx-auto w-6 h-6 rounded-full flex items-center justify-center"
                                            style={{ background: `${p.accent}18` }}>
                                            <ChevronDown className="w-3.5 h-3.5" style={{ color: p.accent }} />
                                        </motion.div>
                                    </motion.button>

                                    {/* ── Expanded Topics (Dark, with connectors) ── */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                                style={{ width: COL_WIDTH, overflow: "visible" }}
                                            >
                                                {/* Connector stem */}
                                                <div className="flex justify-center">
                                                    <div className="w-px h-5" style={{ background: `${p.accent}33` }} />
                                                </div>

                                                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 4px" }}>
                                                    {subj.topics.map((topic, tIdx) => {
                                                        const shortName = topic.name.includes("(")
                                                            ? topic.name.substring(0, topic.name.indexOf("(")).trim()
                                                            : topic.name;
                                                        const detail = topic.name.includes("(")
                                                            ? topic.name.substring(topic.name.indexOf("("))
                                                            : "";
                                                        const pct = Math.round(topic.mastery * 100);
                                                        const heat = heatColor(topic.mastery);

                                                        return (
                                                            <motion.div
                                                                key={topic.id}
                                                                initial={{ opacity: 0, x: -8, scale: 0.97 }}
                                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                                exit={{ opacity: 0, x: -8, scale: 0.97 }}
                                                                transition={{ delay: tIdx * 0.025, duration: 0.25 }}
                                                                style={{ position: "relative" }}
                                                            >
                                                                {/* Connector line between children */}
                                                                {tIdx > 0 && (
                                                                    <div style={{
                                                                        position: "absolute",
                                                                        top: -10,
                                                                        left: "50%",
                                                                        width: 1,
                                                                        height: 10,
                                                                        background: `${p.accent}20`,
                                                                    }} />
                                                                )}

                                                                <Link href={`/dashboard/learn?concept=${topic.id}`}>
                                                                    <motion.div
                                                                        whileHover={{ y: -3, scale: 1.015 }}
                                                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                                        className="flex items-center gap-3 cursor-pointer group"
                                                                        style={{
                                                                            padding: "10px 14px",
                                                                            borderRadius: 14,
                                                                            background: "rgba(15, 23, 42, 0.6)",
                                                                            border: "1px solid rgba(255,255,255,0.05)",
                                                                            boxShadow: `0 4px 20px ${p.glow}, 0 1px 6px rgba(0,0,0,0.2)`,
                                                                            transition: "box-shadow 0.35s ease, border-color 0.35s ease",
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            (e.currentTarget as HTMLElement).style.boxShadow =
                                                                                `0 8px 32px ${p.glow.replace("0.22", "0.38")}, 0 2px 8px rgba(0,0,0,0.3)`;
                                                                            (e.currentTarget as HTMLElement).style.borderColor = `${p.accent}33`;
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            (e.currentTarget as HTMLElement).style.boxShadow =
                                                                                `0 4px 20px ${p.glow}, 0 1px 6px rgba(0,0,0,0.2)`;
                                                                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                                                                        }}
                                                                    >
                                                                        {/* Heat dot */}
                                                                        <div className="flex-shrink-0"
                                                                            style={{
                                                                                width: 8, height: 8, borderRadius: "50%",
                                                                                background: heat,
                                                                                boxShadow: `0 0 10px ${heat}66, 0 0 4px ${heat}44`,
                                                                            }}
                                                                        />

                                                                        {/* Topic name */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[11px] font-semibold leading-tight truncate"
                                                                                style={{ color: "rgba(226,232,240,0.9)", transition: "color 0.2s" }}>
                                                                                {shortName}
                                                                            </p>
                                                                            {detail && (
                                                                                <p className="text-[9px] leading-tight truncate mt-0.5"
                                                                                    style={{ color: "rgba(148,163,184,0.55)" }}>
                                                                                    {detail}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* Mastery % */}
                                                                        <span className="text-[10px] font-bold tabular-nums flex-shrink-0"
                                                                            style={{ color: heat }}>
                                                                            {pct}%
                                                                        </span>

                                                                        {/* Hover learn icon */}
                                                                        <div className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                                            style={{ transition: "opacity 0.3s ease" }}>
                                                                            <div className="w-5 h-5 rounded-md flex items-center justify-center"
                                                                                style={{ background: `${p.accent}20` }}>
                                                                                <BookOpen className="w-2.5 h-2.5" style={{ color: p.accent }} />
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                </Link>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
