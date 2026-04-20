"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { PageShell } from "@/components/layout/PageShell";
import { Loader2, Send, CalendarPlus, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationsContext";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function MessageThreadPage() {
    const params = useParams();
    const threadId = params?.threadId as string;
    const { getToken, isLoaded } = useAuth();
    const { markThreadRead } = useNotifications();

    const [messages, setMessages] = useState<any[]>([]);
    const [peer, setPeer] = useState<{ id: string; name: string; username?: string } | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [showScheduler, setShowScheduler] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoaded || !threadId) return;
        const load = async () => {
            try {
                const token = await getToken();
                const headers = { Authorization: `Bearer ${token}` };
                const [msgRes, infoRes, sessRes] = await Promise.all([
                    fetch(`${API}/messages/thread/${threadId}`, { headers }),
                    fetch(`${API}/messages/thread/${threadId}/info`, { headers }),
                    fetch(`${API}/messages/thread/${threadId}/sessions`, { headers })
                ]);
                const [msgData, infoData, sessData] = await Promise.all([msgRes.json(), infoRes.json(), sessRes.json()]);
                if (msgData.success) setMessages(msgData.data);
                if (infoData.success) setPeer(infoData.data.peer);
                if (sessData.success) setSessions(sessData.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [isLoaded, getToken, threadId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    useEffect(() => {
        if (threadId && !loading) markThreadRead(threadId);
    }, [threadId, loading, markThreadRead]);

    useEffect(() => {
        if (!isLoaded || !threadId || loading) return;
        const poll = async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API}/messages/thread/${threadId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) setMessages(prev => {
                        if (data.data.length !== prev.length) { markThreadRead(threadId); return data.data; }
                        return prev;
                    });
                }
            } catch {}
        };
        const interval = setInterval(poll, 5000);
        return () => clearInterval(interval);
    }, [isLoaded, getToken, threadId, loading, markThreadRead]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !threadId) return;
        try {
            const token = await getToken();
            const res = await fetch(`${API}/messages/thread/${threadId}/send`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });
            if (res.ok) { const d = await res.json(); if (d.success) { setMessages(prev => [...prev, d.data]); setNewMessage(""); } }
        } catch (e) { console.error(e); }
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionTitle || !sessionDate || !sessionTime) return;
        setScheduling(true);
        try {
            const token = await getToken();
            const scheduledAt = new Date(`${sessionDate}T${sessionTime}`).toISOString();
            const res = await fetch(`${API}/messages/thread/${threadId}/sessions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: sessionTitle, scheduledAt })
            });
            const data = await res.json();
            if (data.success) {
                setSessions(prev => [...prev, data.data]);
                setShowScheduler(false);
                setSessionTitle(''); setSessionDate(''); setSessionTime('');
            }
        } catch (e) { console.error(e); }
        finally { setScheduling(false); }
    };

    if (loading) {
        return (
            <PageShell>
                <div className="max-w-4xl mx-auto h-[75vh] rounded-2xl skeleton" />
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="flex flex-col lg:flex-row gap-6 h-[80vh] max-w-5xl mx-auto w-full">

                {/* Chat column */}
                <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border"
                    style={{ borderColor: '#DBE2EF', boxShadow: '0 8px 32px rgba(17,45,78,0.08)', background: 'white' }}>

                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between gap-4"
                        style={{ borderColor: '#DBE2EF', background: 'linear-gradient(135deg, rgba(63,114,175,0.04), rgba(17,45,78,0.02))' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                {peer?.name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <h2 className="font-black text-base leading-tight" style={{ color: '#112D4E' }}>
                                    {peer?.name || 'Study Peer'}
                                </h2>
                                {peer?.username && <p className="text-xs" style={{ color: '#6b84a0' }}>@{peer.username}</p>}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowScheduler(s => !s)}
                            className="rounded-xl text-xs gap-1.5 font-semibold"
                            style={{ borderColor: '#DBE2EF', color: '#3F72AF' }}>
                            <CalendarPlus className="w-3.5 h-3.5" /> Schedule Session
                        </Button>
                    </div>

                    {/* Schedule form */}
                    {showScheduler && (
                        <form onSubmit={handleSchedule} className="p-4 border-b space-y-3"
                            style={{ borderColor: '#DBE2EF', background: 'rgba(63,114,175,0.03)' }}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-black" style={{ color: '#112D4E' }}>New Study Session</p>
                                <button type="button" onClick={() => setShowScheduler(false)} style={{ color: '#6b84a0' }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <input type="text" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)}
                                placeholder="Session title (e.g. DP Review)"
                                className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                                style={{ border: '1px solid #DBE2EF', background: 'white', color: '#112D4E' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }}
                                required />
                            <div className="flex gap-2">
                                <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm rounded-xl outline-none"
                                    style={{ border: '1px solid #DBE2EF', background: 'white', color: '#112D4E' }} required />
                                <input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm rounded-xl outline-none"
                                    style={{ border: '1px solid #DBE2EF', background: 'white', color: '#112D4E' }} required />
                            </div>
                            <Button type="submit" disabled={scheduling} size="sm"
                                className="w-full text-sm font-black text-white border-0 rounded-xl"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Session'}
                            </Button>
                        </form>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ background: '#F9F7F7' }}>
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm" style={{ color: '#6b84a0' }}>
                                No messages yet. Say hello!
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[70%] rounded-2xl px-5 py-3"
                                        style={msg.isMine ? {
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
                                        <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                        <span className="text-[10px] block mt-1"
                                            style={{ color: msg.isMine ? 'rgba(255,255,255,0.6)' : '#6b84a0' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 border-t flex gap-3 items-center"
                        style={{ background: 'white', borderColor: '#DBE2EF' }}>
                        <input type="text" placeholder="Type your message..."
                            className="flex-1 rounded-full px-5 py-3 text-sm outline-none transition-all"
                            style={{ background: '#F9F7F7', border: '1px solid #DBE2EF', color: '#112D4E' }}
                            value={newMessage} onChange={e => setNewMessage(e.target.value)}
                            onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        <button type="submit" disabled={!newMessage.trim()}
                            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all hover:-translate-y-0.5 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', color: 'white', boxShadow: '0 4px 12px rgba(63,114,175,0.35)' }}>
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </form>
                </div>

                {/* Sessions sidebar */}
                <div className="lg:w-72 rounded-2xl border p-5 flex flex-col gap-4 overflow-y-auto"
                    style={{ background: 'white', borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                    <h3 className="font-black flex items-center gap-2" style={{ color: '#112D4E' }}>
                        <Calendar className="w-4 h-4" style={{ color: '#3F72AF' }} /> Study Sessions
                    </h3>
                    {sessions.length === 0 ? (
                        <p className="text-sm leading-relaxed" style={{ color: '#6b84a0' }}>
                            No sessions scheduled yet. Use the button above to schedule one with {peer?.name || 'your peer'}.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {sessions.map((s: any) => (
                                <div key={s.id} className="p-3 rounded-xl border"
                                    style={{ background: 'rgba(63,114,175,0.04)', borderColor: '#DBE2EF' }}>
                                    <p className="font-black text-sm" style={{ color: '#112D4E' }}>{s.title}</p>
                                    <p className="text-xs mt-1 font-semibold" style={{ color: '#3F72AF' }}>
                                        {new Date(s.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                        {' · '}
                                        {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {s.createdBy && <p className="text-xs mt-0.5" style={{ color: '#6b84a0' }}>by {s.createdBy.name}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
