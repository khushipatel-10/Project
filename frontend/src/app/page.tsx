"use client";

import Link from 'next/link';
import { Users, Sparkles, LayoutGrid, ArrowRight, Brain, Network, BookOpen, Zap, Target } from 'lucide-react';
import { useAuth } from "@clerk/nextjs";

const STATS = [
    { value: "12D", label: "Knowledge vector" },
    { value: "4×", label: "Scoring signals" },
    { value: "pgvector", label: "Similarity engine" },
    { value: "GPT-4o", label: "Socratic coach" },
];

const STEPS = [
    {
        num: "01",
        icon: Target,
        title: "Diagnostic Assessment",
        body: "Answer concept-tagged questions. Every answer maps directly to your academic knowledge graph — not a generic score.",
        accent: "#3F72AF",
        bg: "#DBE2EF",
        light: "#f0f4fa",
    },
    {
        num: "02",
        icon: Brain,
        title: "12-Dimensional Vector",
        body: "Your responses are encoded into a 12-feature float vector: confidence, entropy, frustration index, recency decay, and more.",
        accent: "#D4974A",
        bg: "#FDF3C4",
        light: "#fdf8ee",
    },
    {
        num: "03",
        icon: Network,
        title: "Algorithmic Matching",
        body: "pgvector's HNSW index finds peers with complementary gaps — not similar ones. The partner who knows what you don't.",
        accent: "#4a8c42",
        bg: "#CAE8BD",
        light: "#f2faf0",
    },
];

const FEATURES = [
    {
        icon: LayoutGrid,
        title: "Concept-level diagnosis",
        body: "Every question maps to a specific topic. We detect that you struggle with tree traversals, not just 'algorithms'.",
        accent: "#3F72AF",
        bg: "#DBE2EF",
    },
    {
        icon: Sparkles,
        title: "Socratic AI Coach",
        body: "Upload your lecture notes. Your personal tutor guides you with questions, never answers — Socratic method enforced server-side.",
        accent: "#6d4fc7",
        bg: "#ede9fe",
    },
    {
        icon: Users,
        title: "Complementarity matching",
        body: "35% vector similarity + 35% concept complementarity + 15% AI coaching + 15% study style. Your exact academic opposite.",
        accent: "#4a8c42",
        bg: "#CAE8BD",
    },
];

export default function LandingPage() {
    const { isLoaded, userId } = useAuth();
    const authed = isLoaded && !!userId;

    return (
        <div className="flex flex-col min-h-screen w-full" style={{ background: '#F9F7F7' }}>

            {/* ─── Landing nav ─────────────────────────────────────────── */}
            <nav className="w-full sticky top-0 z-50"
                style={{ background: 'rgba(249,247,247,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #DBE2EF' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <span className="font-black text-2xl tracking-tight" style={{ color: '#112D4E' }}>
                        Synapse.
                    </span>
                    <div className="flex items-center gap-3">
                        {!authed && (
                            <Link href="/sign-in"
                                className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors hidden sm:block"
                                style={{ color: '#3F72AF' }}>
                                Sign in
                            </Link>
                        )}
                        <Link href={authed ? "/app/recommendations" : "/sign-up"}
                            className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow-sm transition-all hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                            {authed ? "Go to App →" : "Get started"}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ────────────────────────────────────────────────── */}
            <section className="relative w-full overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
                {/* background texture */}
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07]"
                        style={{ background: 'radial-gradient(circle, #3F72AF, transparent)', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.05]"
                        style={{ background: 'radial-gradient(circle, #D4974A, transparent)', transform: 'translate(-30%, 30%)' }} />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-14">
                    {/* Left — copy */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-7 tracking-wide uppercase"
                            style={{ background: '#DBE2EF', color: '#3F72AF', border: '1px solid #b8c8df' }}>
                            <Sparkles className="w-3.5 h-3.5" /> Vector-based peer matching
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]"
                            style={{ color: '#112D4E' }}>
                            Stop studying<br />
                            <span style={{ color: '#3F72AF' }}>in a vacuum.</span>
                        </h1>

                        <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0"
                            style={{ color: '#2b4a70' }}>
                            Synapse maps your knowledge gaps with a 12-dimensional vector, then finds the peer who has precisely what you lack — not just someone who likes the same subject.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                            <Link href={authed ? "/app/recommendations" : "/sign-up"}
                                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg text-white shadow-[0_4px_20px_rgba(63,114,175,0.35)] hover:shadow-[0_8px_28px_rgba(63,114,175,0.45)] hover:-translate-y-1 transition-all w-full sm:w-auto justify-center"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                Begin Diagnostic <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Right — UI preview card */}
                    <div className="flex-1 w-full max-w-md lg:max-w-none hidden md:block">
                        <div className="rounded-2xl border p-5 shadow-[0_16px_48px_rgba(17,45,78,0.12)]"
                            style={{ background: 'white', borderColor: '#DBE2EF' }}>
                            {/* Mock header */}
                            <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid #DBE2EF' }}>
                                <div>
                                    <p className="text-xs font-bold tracking-wider uppercase" style={{ color: '#6b84a0' }}>Knowledge Profile</p>
                                    <p className="text-base font-black mt-0.5" style={{ color: '#112D4E' }}>Alex Chen · CS101</p>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: '#DBE2EF', color: '#3F72AF' }}>
                                    Vector v7
                                </div>
                            </div>
                            {/* Mock concepts */}
                            <div className="space-y-3 mb-5">
                                {[
                                    { name: "Binary Search Trees",   score: 88, c: "#3F72AF", bg: "#DBE2EF" },
                                    { name: "Dynamic Programming",   score: 42, c: "#D4974A", bg: "#FDF3C4" },
                                    { name: "Graph Traversal",       score: 71, c: "#4a8c42", bg: "#CAE8BD" },
                                    { name: "Heap Sort",             score: 30, c: "#D4974A", bg: "#FDF3C4" },
                                ].map(({ name, score, c, bg }) => (
                                    <div key={name}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium" style={{ color: '#112D4E' }}>{name}</span>
                                            <span className="text-xs font-bold" style={{ color: c }}>{score}%</span>
                                        </div>
                                        <div className="h-2 rounded-full" style={{ background: '#F9F7F7' }}>
                                            <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, background: bg, border: `1px solid ${c}30` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Mock match */}
                            <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: '#F9F7F7', border: '1px solid #DBE2EF' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>J</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold" style={{ color: '#112D4E' }}>Jamie Park</p>
                                    <p className="text-xs" style={{ color: '#6b84a0' }}>Can teach: Dynamic Programming, Heap Sort</p>
                                </div>
                                <div className="text-sm font-black shrink-0" style={{ color: '#3F72AF' }}>94%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Stats bar ───────────────────────────────────────────── */}
            <section className="w-full py-5" style={{ background: '#112D4E' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {STATS.map(({ value, label }) => (
                            <div key={label} className="text-center py-3">
                                <p className="text-2xl font-black" style={{ color: '#DBE2EF' }}>{value}</p>
                                <p className="text-xs font-medium mt-0.5 uppercase tracking-wide" style={{ color: '#6b84a0' }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── How it works ────────────────────────────────────────── */}
            <section className="w-full py-24" style={{ background: 'white' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3F72AF' }}>The Process</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: '#112D4E' }}>
                            How Synapse works
                        </h2>
                        <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: '#2b4a70' }}>
                            Three steps from sign-up to finding the peer who fills your exact knowledge gaps.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px" style={{ background: 'linear-gradient(90deg, #DBE2EF, #DBE2EF)' }} />

                        {STEPS.map(({ num, icon: Icon, title, body, accent, bg, light }) => (
                            <div key={num} className="relative flex flex-col items-center text-center group">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:-translate-y-1"
                                    style={{ background: bg, border: `2px solid ${accent}25` }}>
                                    <Icon className="w-9 h-9" style={{ color: accent }} />
                                </div>
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-black px-2 py-0.5 rounded-full"
                                    style={{ background: accent, color: 'white' }}>
                                    {num}
                                </div>
                                <h3 className="text-xl font-black mb-3" style={{ color: '#112D4E' }}>{title}</h3>
                                <p className="text-base leading-relaxed" style={{ color: '#2b4a70' }}>{body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Feature cards ───────────────────────────────────────── */}
            <section className="w-full py-24" style={{ background: '#F9F7F7' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#3F72AF' }}>Features</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: '#112D4E' }}>
                            Built for real learning
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {FEATURES.map(({ icon: Icon, title, body, accent, bg }) => (
                            <div key={title} className="card-hover bg-white rounded-2xl p-8 border flex flex-col"
                                style={{ borderColor: '#DBE2EF' }}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                                    style={{ background: bg }}>
                                    <Icon className="w-6 h-6" style={{ color: accent }} />
                                </div>
                                <h3 className="text-xl font-black mb-3" style={{ color: '#112D4E' }}>{title}</h3>
                                <p className="leading-relaxed flex-1" style={{ color: '#2b4a70' }}>{body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}
