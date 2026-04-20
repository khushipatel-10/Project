"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight, Users, ChevronRight, Trophy, Layers } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

interface PeerMatch {
    user: { id: string; name: string; major?: string };
    matchScore: number;
    details: { teachConcepts: string[]; peerStrongConcepts: string[] };
}

function ScoreRing({ score }: { score: number }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    const color  = score >= 75 ? '#4a8c42' : score >= 50 ? '#3F72AF' : '#D4974A';
    const track  = score >= 75 ? '#CAE8BD' : score >= 50 ? '#DBE2EF' : '#FDF3C4';

    return (
        <div className="relative flex items-center justify-center w-36 h-36">
            <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
                <circle cx="72" cy="72" r={r} fill="none" stroke={track} strokeWidth="13" />
                <circle cx="72" cy="72" r={r} fill="none"
                    stroke={color} strokeWidth="13" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)' }}
                    className="animate-ring"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black" style={{ color }}>{Math.round(score)}%</span>
                <span className="text-xs font-semibold" style={{ color: '#6b84a0' }}>mastery</span>
            </div>
        </div>
    );
}

export default function AssessmentResultsPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [results, setResults] = useState<any>(null);
    const [peers, setPeers] = useState<PeerMatch[]>([]);
    const [peersLoading, setPeersLoading] = useState(false);

    useEffect(() => {
        const data = sessionStorage.getItem('lastAssessmentResult');
        if (data) setResults(JSON.parse(data));
        else router.push('/app/recommendations');
    }, [router]);

    useEffect(() => {
        if (!results) return;
        (async () => {
            setPeersLoading(true);
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recommendations/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) setPeers((json.data.topPairs || []).slice(0, 3));
            } catch { /* non-critical */ }
            finally { setPeersLoading(false); }
        })();
    }, [results, getToken]);

    if (!results) return null;

    const score = results.score ?? 0;
    const grade =
        score >= 85 ? { label: 'Excellent',  color: '#4a8c42', bg: '#ECFAE5', border: '#CAE8BD' } :
        score >= 70 ? { label: 'Proficient', color: '#3F72AF', bg: '#DBE2EF', border: '#b8c8df' } :
        score >= 50 ? { label: 'Developing', color: '#D4974A', bg: '#FDF3C4', border: '#ECC880' } :
                      { label: 'Beginner',   color: '#be123c', bg: '#fff1f2', border: '#fecdd3' };

    return (
        <PageShell>
            <div className="max-w-3xl mx-auto w-full space-y-5 animate-fade-slide-up">

                {/* Hero score card */}
                <div className="bg-white rounded-2xl overflow-hidden border"
                    style={{ borderColor: '#DBE2EF', boxShadow: '0 8px 32px rgba(17,45,78,0.09)' }}>
                    <div className="h-2 w-full"
                        style={{ background: 'linear-gradient(90deg, #3F72AF, #112D4E, #4a8c42)' }} />
                    <div className="p-8 flex flex-col sm:flex-row items-center gap-8">
                        <ScoreRing score={score} />
                        <div className="flex-1 text-center sm:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black mb-3"
                                style={{ background: grade.bg, color: grade.color, border: `1px solid ${grade.border}` }}>
                                <Trophy className="w-3.5 h-3.5" /> {grade.label}
                            </div>
                            <h1 className="text-3xl font-black tracking-tight" style={{ color: '#112D4E' }}>
                                Diagnosis Complete
                            </h1>
                            <p className="mt-2 leading-relaxed text-sm" style={{ color: '#2b4a70' }}>
                                Your knowledge vector has been computed and your profile reindexed. Peer recommendations are now more accurate.
                            </p>
                            {results.conceptScores && Object.keys(results.conceptScores).length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {Object.entries(results.conceptScores as Record<string, number>).slice(0, 4).map(([concept, s]) => (
                                        <span key={concept} className="text-xs font-bold px-2.5 py-1 rounded-lg"
                                            style={{
                                                background: (s as number) >= 70 ? '#ECFAE5' : '#FDF3C4',
                                                color:      (s as number) >= 70 ? '#2d5a27' : '#9B6B30',
                                                border: `1px solid ${(s as number) >= 70 ? '#CAE8BD' : '#ECC880'}`,
                                            }}>
                                            {concept}: {Math.round(s as number)}%
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Concept breakdown */}
                <div className="bg-white rounded-2xl border overflow-hidden"
                    style={{ borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                    <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#DBE2EF' }}>
                        <Layers className="w-5 h-5" style={{ color: '#3F72AF' }} />
                        <h2 className="font-black" style={{ color: '#112D4E' }}>Concept Breakdown</h2>
                    </div>
                    <div className="p-6 grid sm:grid-cols-2 gap-6">
                        <div>
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-3"
                                style={{ color: '#4a8c42' }}>
                                <TrendingUp className="w-3.5 h-3.5" /> Strengths
                            </h3>
                            {results.strengths?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {results.strengths.map((s: string) => (
                                        <span key={s} className="text-sm px-3 py-1.5 rounded-lg font-semibold"
                                            style={{ background: '#ECFAE5', color: '#2d5a27', border: '1px solid #CAE8BD' }}>
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm" style={{ color: '#6b84a0' }}>Take more assessments to identify strengths.</p>
                            )}
                        </div>
                        <div>
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-3"
                                style={{ color: '#D4974A' }}>
                                <TrendingDown className="w-3.5 h-3.5" /> Development Areas
                            </h3>
                            {results.weaknesses?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {results.weaknesses.map((w: string) => (
                                        <span key={w} className="text-sm px-3 py-1.5 rounded-lg font-semibold"
                                            style={{ background: '#FDF3C4', color: '#9B6B30', border: '1px solid #ECC880' }}>
                                            {w}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm font-semibold" style={{ color: '#4a8c42' }}>No significant gaps detected!</p>
                            )}
                        </div>
                    </div>
                    {results.weaknesses?.length > 0 && (
                        <div className="mx-6 mb-6 p-4 rounded-xl border"
                            style={{ background: 'rgba(63,114,175,0.04)', borderColor: '#DBE2EF' }}>
                            <p className="text-sm leading-relaxed" style={{ color: '#2b4a70' }}>
                                <span className="font-black" style={{ color: '#112D4E' }}>Algorithmic action: </span>
                                The matching engine is now prioritising peers who excel in{' '}
                                <span className="font-black" style={{ color: '#3F72AF' }}>{results.weaknesses[0]}</span>{' '}
                                to provide structural complementarity.
                            </p>
                        </div>
                    )}
                </div>

                {/* Peer suggestions */}
                <div className="bg-white rounded-2xl border overflow-hidden"
                    style={{ borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                    <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#DBE2EF' }}>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" style={{ color: '#3F72AF' }} />
                            <h2 className="font-black" style={{ color: '#112D4E' }}>Suggested Peers</h2>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#6b84a0' }}>Based on updated vector</span>
                    </div>
                    <div className="p-4">
                        {peersLoading ? (
                            <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}</div>
                        ) : peers.length === 0 ? (
                            <p className="text-sm text-center py-6" style={{ color: '#6b84a0' }}>
                                No matches yet — other students need to complete assessments too.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {peers.map((peer, idx) => (
                                    <div key={peer.user.id} className="flex items-center gap-4 p-3 rounded-xl transition-colors"
                                        style={{ background: '#F9F7F7' }}>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white"
                                            style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm" style={{ color: '#112D4E' }}>{peer.user.name}</p>
                                            {peer.details?.peerStrongConcepts?.length > 0 && (
                                                <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>
                                                    Strong in:{' '}
                                                    <span className="font-semibold" style={{ color: '#4a8c42' }}>
                                                        {peer.details.peerStrongConcepts.slice(0,2).join(', ')}
                                                    </span>
                                                </p>
                                            )}
                                            {peer.details?.teachConcepts?.length > 0 && (
                                                <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>
                                                    Can teach:{' '}
                                                    <span className="font-semibold" style={{ color: '#6d4fc7' }}>
                                                        {peer.details.teachConcepts.slice(0,2).join(', ')}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-black" style={{ color: '#3F72AF' }}>
                                                {Math.round(peer.matchScore * 100)}%
                                            </div>
                                            <div className="text-xs" style={{ color: '#6b84a0' }}>match</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pb-6">
                    <Button onClick={() => router.push('/app/recommendations')}
                        className="flex-1 h-12 rounded-xl gap-2 font-black text-white border-0 text-base hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 16px rgba(63,114,175,0.35)' }}>
                        View Matches <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/app/assessments')}
                        className="rounded-xl h-12 gap-2 font-semibold text-base"
                        style={{ borderColor: '#DBE2EF', color: '#112D4E' }}>
                        Take Another <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}
