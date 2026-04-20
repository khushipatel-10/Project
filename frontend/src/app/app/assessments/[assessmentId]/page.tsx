"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export default function AssessmentQuizPage() {
    const { assessmentId } = useParams();
    const { getToken } = useAuth();
    const router = useRouter();

    const [assessment, setAssessment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQ, setCurrentQ] = useState(0);
    const [submitError, setSubmitError] = useState("");
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadTest() {
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/assessments/${assessmentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setAssessment(data.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        loadTest();
    }, [assessmentId, getToken]);

    const handleSelect = (questionId: string, option: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleNext = () => {
        if (currentQ < (assessment?.questions?.length ?? 1) - 1) {
            setCurrentQ(q => q + 1);
            cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    const handlePrev = () => { if (currentQ > 0) setCurrentQ(q => q - 1); };

    const handleSubmit = async () => {
        if (!assessment) return;
        const total = assessment.questions.length;
        const answered = Object.keys(answers).length;
        if (answered < total) {
            setSubmitError(`${total - answered} question${total - answered > 1 ? 's' : ''} still unanswered.`);
            return;
        }
        setSubmitError("");
        setSubmitting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/assessments/${assessmentId}/submit`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (data.success) {
                sessionStorage.setItem('lastAssessmentResult', JSON.stringify(data.data));
                router.push(`/app/assessments/${assessmentId}/results`);
            } else {
                setSubmitError("Failed to save: " + data.error);
                setSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <PageShell>
                <div className="max-w-2xl mx-auto mt-10 space-y-4">
                    <div className="h-4 rounded-full skeleton w-full" />
                    <div className="h-64 rounded-2xl skeleton" />
                </div>
            </PageShell>
        );
    }
    if (!assessment) {
        return (
            <PageShell>
                <div className="max-w-2xl mx-auto mt-16 text-center">
                    <p style={{ color: '#6b84a0' }}>Assessment not found.</p>
                    <Button className="mt-4" onClick={() => router.push('/app/assessments')}>Back</Button>
                </div>
            </PageShell>
        );
    }

    const questions = assessment.questions ?? [];
    const total = questions.length;
    const answeredCount = Object.keys(answers).length;
    const progress = total > 0 ? (answeredCount / total) * 100 : 0;
    const isLast = currentQ === total - 1;
    const q = questions[currentQ];

    let options: string[] = [];
    try { options = typeof q?.options === 'string' ? JSON.parse(q.options) : (q?.options ?? []); }
    catch { options = []; }

    const selectedOption = answers[q?.id] ?? null;
    const allDone = answeredCount === total;

    return (
        <PageShell>
            <div className="max-w-2xl mx-auto w-full">
                {/* Back link */}
                <button onClick={() => router.push('/app/assessments')}
                    className="flex items-center gap-1 text-sm font-semibold mb-4 transition-opacity hover:opacity-70"
                    style={{ color: '#3F72AF' }}>
                    <ChevronLeft className="w-4 h-4" /> All Assessments
                </button>

                <h1 className="text-2xl font-black mb-1" style={{ color: '#112D4E' }}>{assessment.title}</h1>
                <p className="text-sm mb-6" style={{ color: '#6b84a0' }}>{assessment.description}</p>

                {/* Progress card */}
                <div className="mb-5 bg-white rounded-2xl border p-4" style={{ borderColor: '#DBE2EF' }}>
                    <div className="flex justify-between items-center mb-2.5">
                        <span className="text-sm font-bold" style={{ color: '#112D4E' }}>Question {currentQ + 1} of {total}</span>
                        <span className="text-sm font-bold" style={{ color: allDone ? '#4a8c42' : '#3F72AF' }}>
                            {answeredCount}/{total} answered
                        </span>
                    </div>
                    {/* Track */}
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#F9F7F7' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${progress}%`,
                                background: allDone
                                    ? 'linear-gradient(90deg, #4a8c42, #B0DB9C)'
                                    : 'linear-gradient(90deg, #3F72AF, #112D4E)'
                            }} />
                    </div>
                    {/* Dot nav */}
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                        {questions.map((_: any, i: number) => {
                            const done = !!answers[questions[i]?.id];
                            const active = i === currentQ;
                            return (
                                <button key={i} onClick={() => setCurrentQ(i)}
                                    className="w-7 h-7 rounded-lg text-xs font-black border transition-all"
                                    style={{
                                        background: active ? '#3F72AF' : done ? '#ECFAE5' : 'white',
                                        color: active ? 'white' : done ? '#4a8c42' : '#6b84a0',
                                        borderColor: active ? '#3F72AF' : done ? '#CAE8BD' : '#DBE2EF',
                                    }}>
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Question card */}
                <div ref={cardRef} className="bg-white rounded-2xl overflow-hidden border"
                    style={{ borderColor: '#DBE2EF', boxShadow: '0 4px 20px rgba(17,45,78,0.07)' }}>
                    {/* Header */}
                    <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: '#DBE2EF', background: 'linear-gradient(135deg, rgba(63,114,175,0.03), rgba(17,45,78,0.02))' }}>
                        <div className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                {currentQ + 1}
                            </div>
                            <div>
                                {q?.conceptName && (
                                    <p className="text-[11px] font-black tracking-widest uppercase mb-1.5"
                                        style={{ color: '#3F72AF' }}>
                                        {q.conceptName}
                                    </p>
                                )}
                                <p className="text-lg font-bold leading-snug" style={{ color: '#112D4E' }}>
                                    {q?.questionText}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="p-6 space-y-3">
                        {options.map((opt: string, optIdx: number) => {
                            const isSelected = selectedOption === opt;
                            const letter = OPTION_LETTERS[optIdx] ?? String(optIdx + 1);
                            return (
                                <button key={optIdx} onClick={() => handleSelect(q.id, opt)}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150"
                                    style={{
                                        background: isSelected ? '#DBE2EF' : 'white',
                                        borderColor: isSelected ? '#3F72AF' : '#DBE2EF',
                                        boxShadow: isSelected ? '0 0 0 2px rgba(63,114,175,0.2)' : 'none',
                                    }}>
                                    <span className="option-letter"
                                        style={{
                                            background: isSelected ? '#3F72AF' : '#F9F7F7',
                                            color: isSelected ? 'white' : '#6b84a0',
                                            border: `1px solid ${isSelected ? '#3F72AF' : '#DBE2EF'}`,
                                        }}>
                                        {letter}
                                    </span>
                                    <span className="flex-1 text-sm font-semibold" style={{ color: isSelected ? '#112D4E' : '#2b4a70' }}>
                                        {opt}
                                    </span>
                                    {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#3F72AF' }} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Nav footer */}
                    <div className="px-6 pb-6 flex justify-between items-center gap-3 border-t" style={{ borderColor: '#DBE2EF' }}>
                        <Button variant="outline" onClick={handlePrev} disabled={currentQ === 0}
                            className="rounded-xl gap-2 font-semibold disabled:opacity-40"
                            style={{ borderColor: '#DBE2EF', color: '#112D4E' }}>
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>

                        {isLast ? (
                            <Button onClick={handleSubmit} disabled={submitting}
                                className="rounded-xl gap-2 font-black text-white border-0 px-6 transition-all hover:-translate-y-0.5"
                                style={{
                                    background: allDone ? 'linear-gradient(135deg, #3F72AF, #112D4E)' : '#b8c8df',
                                    boxShadow: allDone ? '0 4px 16px rgba(63,114,175,0.4)' : 'none',
                                }}>
                                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</> : <><Send className="w-4 h-4" /> Submit & Get Results</>}
                            </Button>
                        ) : (
                            <Button onClick={handleNext}
                                className="rounded-xl gap-2 font-black text-white border-0 px-6 hover:-translate-y-0.5 transition-all"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 14px rgba(63,114,175,0.35)' }}>
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Error */}
                {submitError && (
                    <div className="mt-4 p-4 rounded-xl border text-sm font-semibold"
                        style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}>
                        {submitError}
                    </div>
                )}

                {/* All-done shortcut */}
                {allDone && !isLast && (
                    <div className="mt-4 p-4 rounded-xl border flex items-center justify-between gap-4"
                        style={{ background: '#ECFAE5', borderColor: '#CAE8BD' }}>
                        <div>
                            <p className="text-sm font-black" style={{ color: '#4a8c42' }}>All questions answered!</p>
                            <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>Review or submit now.</p>
                        </div>
                        <Button onClick={handleSubmit} disabled={submitting}
                            className="rounded-xl gap-2 font-black text-white border-0 shrink-0"
                            style={{ background: 'linear-gradient(135deg, #4a8c42, #2d5a27)', boxShadow: '0 4px 14px rgba(74,140,66,0.35)' }}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Submit Now
                        </Button>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
