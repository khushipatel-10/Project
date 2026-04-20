"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, Send, Sparkles, CheckCircle2, Folder, FileText, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type Message = { role: 'user' | 'assistant'; content: string };
type Session = { id: string; pdfName: string | null; status: string; messages: Message[] | null; scores: any[]; createdAt: string; transcript: string | null };

export default function LearnPage() {
    const { getToken, isLoaded } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<any>(null);
    const [pastSessions, setPastSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [sessionStatus, setSessionStatus] = useState<'active' | 'completed'>('active');
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (!isLoaded) return; fetchSessions(); }, [isLoaded]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

    async function fetchSessions() {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/learn/sessions`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setPastSessions(data.data);
        } catch (e) { console.error(e); }
    }

    async function handleSelectSession(session: Session) {
        setSessionId(null); setEvaluationResult(null); setError(null);
        if (session.status === 'active') {
            try {
                const token = await getToken();
                const res = await fetch(`${API}/learn/${session.id}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) {
                    const loaded: Session = data.data;
                    const msgs = Array.isArray(loaded.messages) ? loaded.messages : [];
                    setMessages(msgs.length === 0
                        ? [{ role: 'assistant', content: "I've reviewed your document! What concepts would you like to focus on, or shall I quiz you on the core ideas?" }]
                        : msgs);
                    setSessionId(loaded.id);
                    setSessionStatus('active');
                    setSelectedSession(null);
                }
            } catch (e) { console.error(e); }
        } else {
            setSelectedSession(session);
        }
    }

    async function handleUpload() {
        if (!file || !isLoaded) return;
        setIsUploading(true); setError(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const token = await getToken();
            const res = await fetch(`${API}/learn/upload`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessionId(data.data.sessionId);
                setSessionStatus('active');
                setMessages([{ role: 'assistant', content: "I've reviewed your document! What concepts would you like to focus on, or shall I start by quizzing you on the core ideas?" }]);
                await fetchSessions();
            } else {
                setError("Failed to upload: " + data.message);
            }
        } catch (e) { setError("Upload error. Please try again."); }
        finally { setIsUploading(false); }
    }

    async function handleSendMessage() {
        if (!input.trim() || !sessionId || !isLoaded) return;
        const userMsg = input.trim();
        setInput(""); chatInputRef.current?.focus();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/learn/chat`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: userMsg })
            });
            if (!res.body) throw new Error("No response body");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";
            setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                for (const line of chunk.split('\n')) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const parsed = JSON.parse(line.slice(6));
                            if (parsed.text) {
                                assistantContent += parsed.text;
                                setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: assistantContent }; return u; });
                            }
                            if (parsed.error) setError(parsed.error);
                        } catch (_) {}
                    }
                }
            }
        } catch (e) { console.error(e); setError("Failed to get response. Please try again."); }
        finally { setIsTyping(false); setTimeout(() => chatInputRef.current?.focus(), 50); }
    }

    async function handleFinishSession() {
        if (!sessionId || !isLoaded) return;
        setIsEvaluating(true); setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/learn/${sessionId}/evaluate`, {
                method: "POST", headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setEvaluationResult(data.data);
                setSessionStatus('completed');
                await fetchSessions();
            } else { setError(data.message || "Failed to evaluate session."); }
        } catch (e) { setError("Evaluation error. Please try again."); }
        finally { setIsEvaluating(false); }
    }

    function startNewSession() {
        setSessionId(null); setEvaluationResult(null); setSelectedSession(null);
        setMessages([]); setFile(null); setError(null); setSessionStatus('active');
    }

    const msgBubble = (m: Message, i: number) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed"
                style={m.role === 'user' ? {
                    background: 'linear-gradient(135deg, #3F72AF, #112D4E)',
                    color: 'white',
                    borderBottomRightRadius: '4px',
                    boxShadow: '0 2px 8px rgba(63,114,175,0.25)',
                } : {
                    background: 'white',
                    border: '1px solid #DBE2EF',
                    color: '#112D4E',
                    borderBottomLeftRadius: '4px',
                }}>
                {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-strong:font-black prose-code:px-1 prose-code:rounded prose-ol:my-1 prose-ul:my-1"
                        style={{ color: '#112D4E' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                ) : m.content}
            </div>
        </div>
    );

    // Evaluation result screen
    if (evaluationResult) {
        const scores = [
            { label: 'Comprehension', value: evaluationResult.comprehensionScore, color: '#3F72AF', bg: 'rgba(63,114,175,0.08)', border: '#DBE2EF' },
            { label: 'Implementation', value: evaluationResult.implementationScore, color: '#6d4fc7', bg: 'rgba(109,79,199,0.08)', border: '#c4b5fd' },
            { label: 'Integration', value: evaluationResult.integrationScore, color: '#4a8c42', bg: 'rgba(74,140,66,0.08)', border: '#CAE8BD' },
        ];
        return (
            <PageShell>
                <div className="max-w-2xl mx-auto py-12 w-full">
                    <div className="bg-white rounded-2xl overflow-hidden"
                        style={{ border: '1px solid #DBE2EF', boxShadow: '0 20px 60px rgba(17,45,78,0.1)' }}>
                        <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #3F72AF, #112D4E, #4a8c42)' }} />
                        <div className="text-center px-10 pt-10 pb-6">
                            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
                                style={{ background: '#ECFAE5' }}>
                                <CheckCircle2 className="w-8 h-8" style={{ color: '#4a8c42' }} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight" style={{ color: '#112D4E' }}>Session Complete</h2>
                            <p className="mt-2" style={{ color: '#2b4a70' }}>Your learning profile has been updated.</p>
                        </div>
                        <div className="px-8 pb-8 space-y-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                {scores.map(({ label, value, color, bg, border }) => (
                                    <div key={label} className="p-4 rounded-2xl border" style={{ background: bg, borderColor: border }}>
                                        <div className="text-3xl font-black" style={{ color }}>{value}%</div>
                                        <div className="text-xs font-black uppercase tracking-wider mt-1" style={{ color }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                            {evaluationResult.hintDependencyScore !== undefined && (
                                <div className="p-4 rounded-xl border text-center"
                                    style={{ background: '#FDF3C4', borderColor: '#ECC880' }}>
                                    <p className="text-sm font-black" style={{ color: '#9B6B30' }}>
                                        Hint Dependency: {evaluationResult.hintDependencyScore}%
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>Lower is better — shows independent problem-solving</p>
                                </div>
                            )}
                            {evaluationResult.conceptGaps?.length > 0 && (
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#6b84a0' }}>Knowledge Gaps</p>
                                    <div className="flex flex-wrap gap-2">
                                        {evaluationResult.conceptGaps.map((gap: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 rounded-xl text-sm font-semibold"
                                                style={{ background: '#FDF3C4', color: '#9B6B30', border: '1px solid #ECC880' }}>{gap}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {evaluationResult.coachFeedback && (
                                <div className="p-4 rounded-xl border" style={{ background: 'rgba(63,114,175,0.04)', borderColor: '#DBE2EF' }}>
                                    <p className="text-sm italic leading-relaxed" style={{ color: '#2b4a70' }}>
                                        &ldquo;{evaluationResult.coachFeedback}&rdquo;
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-center pt-2">
                                <Button onClick={startNewSession} className="font-black text-white border-0 rounded-xl px-8 h-12 hover:-translate-y-0.5 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 16px rgba(63,114,175,0.35)' }}>
                                    Start Another Session
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] max-w-6xl mx-auto gap-6 w-full">

                {/* Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-4">
                    <Button onClick={startNewSession} className="w-full font-black text-white border-0 h-12 rounded-xl hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 14px rgba(63,114,175,0.35)' }}>
                        + New Study Session
                    </Button>
                    <div className="flex-1 overflow-y-auto rounded-2xl border p-3"
                        style={{ background: 'white', borderColor: '#DBE2EF', boxShadow: '0 2px 8px rgba(17,45,78,0.04)' }}>
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <Folder className="w-4 h-4" style={{ color: '#6d4fc7' }} />
                            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#6b84a0' }}>My Sessions</h3>
                        </div>
                        {pastSessions.length === 0 ? (
                            <p className="text-sm px-2" style={{ color: '#6b84a0' }}>No sessions yet.</p>
                        ) : (
                            <div className="space-y-1 ml-2 pl-2 pb-2 border-l-2" style={{ borderColor: '#DBE2EF' }}>
                                {pastSessions.map(s => {
                                    const isActive = s.id === sessionId || selectedSession?.id === s.id;
                                    return (
                                        <div key={s.id} onClick={() => handleSelectSession(s)}
                                            className="p-2 rounded-xl cursor-pointer transition-colors text-sm flex items-start gap-2"
                                            style={{
                                                background: isActive ? 'rgba(109,79,199,0.08)' : 'transparent',
                                                border: isActive ? '1px solid rgba(109,79,199,0.2)' : '1px solid transparent',
                                                color: isActive ? '#4c3490' : '#112D4E',
                                            }}>
                                            <FileText className="w-4 h-4 mt-0.5 shrink-0" style={{ color: isActive ? '#6d4fc7' : '#6b84a0' }} />
                                            <div className="min-w-0">
                                                <div className="line-clamp-1 font-semibold">{s.pdfName || 'Untitled Session'}</div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full"
                                                        style={{ background: s.status === 'active' ? '#4a8c42' : '#6b84a0' }} />
                                                    <span className="text-[10px]" style={{ color: '#6b84a0' }}>
                                                        {s.status === 'active' ? 'In Progress' : 'Completed'} · {new Date(s.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main area */}
                <div className="flex-1 flex flex-col h-full">
                    <div className="mb-5">
                        <h1 className="text-3xl font-black tracking-tight" style={{ color: '#112D4E' }}>AI Learning Coach</h1>
                        <p className="mt-1" style={{ color: '#2b4a70' }}>Upload PDF material to begin a Socratic coaching session.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold"
                            style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c' }}>
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    {/* Completed session view */}
                    {selectedSession ? (
                        <div className="flex-1 overflow-hidden rounded-2xl border flex flex-col"
                            style={{ background: 'white', borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                            <div className="border-b px-6 py-4" style={{ borderColor: '#DBE2EF', background: 'rgba(63,114,175,0.03)' }}>
                                <p className="font-black" style={{ color: '#112D4E' }}>{selectedSession.pdfName || 'Session'}</p>
                                <p className="text-sm" style={{ color: '#6b84a0' }}>Completed · {new Date(selectedSession.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {selectedSession.scores?.[0] && (
                                    <div className="grid grid-cols-3 gap-3 text-center mb-4">
                                        {[
                                            { label: 'Comprehension', value: selectedSession.scores[0].comprehensionScore, color: '#3F72AF', bg: 'rgba(63,114,175,0.08)' },
                                            { label: 'Implementation', value: selectedSession.scores[0].implementationScore, color: '#6d4fc7', bg: 'rgba(109,79,199,0.08)' },
                                            { label: 'Integration', value: selectedSession.scores[0].integrationScore, color: '#4a8c42', bg: 'rgba(74,140,66,0.08)' },
                                        ].map(({ label, value, color, bg }) => (
                                            <div key={label} className="p-3 rounded-xl" style={{ background: bg }}>
                                                <div className="text-xl font-black" style={{ color }}>{value}%</div>
                                                <div className="text-[10px] font-black uppercase mt-0.5" style={{ color }}>{label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {(Array.isArray(selectedSession.messages) ? selectedSession.messages : []).map((m: Message, i: number) => msgBubble(m, i))}
                                    {!Array.isArray(selectedSession.messages) && selectedSession.transcript &&
                                        selectedSession.transcript.split('\n\n').filter(l => l.trim()).map((l: string, i: number) => {
                                            const isUser = l.startsWith('user:');
                                            const content = l.replace(/^(user|assistant): /, '');
                                            return msgBubble({ role: isUser ? 'user' : 'assistant', content }, i);
                                        })
                                    }
                                </div>
                            </div>
                        </div>

                    ) : !sessionId ? (
                        // Upload screen
                        <div className="flex-1 rounded-2xl border flex flex-col items-center justify-center p-12 text-center"
                            style={{ background: 'white', borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border"
                                style={{ background: 'rgba(63,114,175,0.05)', borderColor: '#DBE2EF' }}>
                                <UploadCloud className="w-10 h-10" style={{ color: '#3F72AF', opacity: 0.8 }} />
                            </div>
                            <h2 className="text-2xl font-black mb-2" style={{ color: '#112D4E' }}>Upload Course Material</h2>
                            <p className="max-w-md mb-8 leading-relaxed" style={{ color: '#2b4a70' }}>
                                Drop your PDF slides, textbook chapters, or assignments. The coach uses Socratic method — guiding you to answers through questions.
                            </p>
                            <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} className="hidden" id="pdf-upload" />
                            <label htmlFor="pdf-upload"
                                className="cursor-pointer inline-flex items-center justify-center rounded-xl px-8 py-3 font-black text-white transition-all hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 14px rgba(63,114,175,0.35)' }}>
                                Choose PDF File
                            </label>
                            {file && (
                                <div className="mt-6 flex flex-col items-center gap-4">
                                    <span className="text-sm font-semibold px-4 py-2 rounded-xl"
                                        style={{ background: 'rgba(63,114,175,0.08)', color: '#3F72AF', border: '1px solid #DBE2EF' }}>
                                        {file.name}
                                    </span>
                                    <Button onClick={handleUpload} disabled={isUploading}
                                        className="font-black text-white border-0 rounded-xl px-8"
                                        style={{ background: 'linear-gradient(135deg, #4a8c42, #2d5a27)' }}>
                                        {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Parsing...</> : "Start Coaching Session"}
                                    </Button>
                                </div>
                            )}
                        </div>

                    ) : (
                        // Active chat
                        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border"
                            style={{ background: 'white', borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                            <div className="border-b px-5 py-4 flex items-center justify-between"
                                style={{ borderColor: '#DBE2EF', background: 'rgba(63,114,175,0.03)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
                                        style={{ background: 'white', borderColor: '#DBE2EF', boxShadow: '0 2px 8px rgba(17,45,78,0.06)' }}>
                                        <Sparkles className="w-5 h-5" style={{ color: '#6d4fc7' }} />
                                    </div>
                                    <div>
                                        <p className="font-black" style={{ color: '#112D4E' }}>Synapse Coach</p>
                                        <p className="text-xs font-semibold" style={{ color: '#4a8c42' }}>Session Active — Socratic Mode</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={handleFinishSession} disabled={isEvaluating || messages.length < 2}
                                    className="rounded-xl font-semibold text-sm"
                                    style={{ borderColor: '#ECC880', color: '#9B6B30' }}>
                                    {isEvaluating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring...</> : "Finish & Score"}
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: '#F9F7F7' }}>
                                {messages.map((m, i) => msgBubble(m, i))}
                                {isTyping && messages[messages.length - 1]?.role === 'user' && (
                                    <div className="flex justify-start">
                                        <div className="p-4 rounded-2xl border" style={{ background: 'white', borderColor: '#DBE2EF' }}>
                                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#3F72AF' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
                                className="p-4 border-t flex gap-3" style={{ borderColor: '#DBE2EF', background: 'white' }}>
                                <input ref={chatInputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                                    placeholder="Answer or ask a question..."
                                    className="flex-1 px-4 py-3 rounded-xl outline-none transition-all text-sm"
                                    style={{ background: '#F9F7F7', border: '1px solid #DBE2EF', color: '#112D4E' }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; e.currentTarget.style.background = 'white'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#F9F7F7'; }}
                                    disabled={isTyping} />
                                <Button type="submit" disabled={!input.trim() || isTyping}
                                    className="rounded-xl px-5 font-black text-white border-0"
                                    style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
