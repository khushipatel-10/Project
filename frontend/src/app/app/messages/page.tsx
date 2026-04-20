"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, MessageSquare } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import Link from "next/link";

const LS_KEY = "synapse_thread_reads";

function getReadMap(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}

export default function MessagesIndexPage() {
    const { getToken, isLoaded } = useAuth();
    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [myUserId, setMyUserId] = useState("");

    useEffect(() => {
        async function fetchThreads() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const [threadsRes, meRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/messages/threads`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);
                if (threadsRes.ok) { const d = await threadsRes.json(); if (d.success) setThreads(d.data); }
                if (meRes.ok) { const d = await meRes.json(); if (d.success) setMyUserId(d.data.id); }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchThreads();
    }, [isLoaded, getToken]);

    if (loading) {
        return (
            <PageShell>
                <div className="max-w-2xl mx-auto space-y-3 mt-6">
                    {[0,1,2].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}
                </div>
            </PageShell>
        );
    }

    const reads = getReadMap();

    return (
        <PageShell>
            <div className="max-w-2xl mx-auto w-full">
                <div className="mb-8 pb-6 border-b" style={{ borderColor: '#DBE2EF' }}>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: '#112D4E' }}>
                        <MessageSquare className="w-8 h-8" style={{ color: '#3F72AF' }} /> Messages
                    </h1>
                    <p className="text-lg mt-1.5" style={{ color: '#2b4a70' }}>Your study peer conversations.</p>
                </div>

                {threads.length > 0 ? (
                    <div className="space-y-3">
                        {threads.map(thread => {
                            const lastMsg = thread.lastMessage;
                            const isUnread = lastMsg &&
                                lastMsg.senderId !== myUserId &&
                                (!reads[thread.id] || new Date(lastMsg.createdAt) > new Date(reads[thread.id]));

                            return (
                                <Link href={`/app/messages/${thread.id}`} key={thread.id}>
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5"
                                        style={{
                                            borderColor: isUnread ? '#3F72AF' : '#DBE2EF',
                                            background: isUnread ? 'rgba(63,114,175,0.03)' : 'white',
                                            boxShadow: isUnread ? '0 4px 16px rgba(63,114,175,0.1)' : '0 2px 8px rgba(17,45,78,0.04)',
                                        }}>
                                        <div className="relative shrink-0">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white"
                                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                                {thread.peer?.name?.charAt(0) || 'U'}
                                            </div>
                                            {isUnread && (
                                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                                                    style={{ background: '#3F72AF' }} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-base leading-tight ${isUnread ? 'font-black' : 'font-semibold'}`}
                                                style={{ color: '#112D4E' }}>
                                                {thread.peer?.name || 'Unknown Peer'}
                                            </p>
                                            <p className={`text-sm truncate mt-0.5 ${isUnread ? 'font-medium' : ''}`}
                                                style={{ color: isUnread ? '#2b4a70' : '#6b84a0' }}>
                                                {thread.lastMessage?.content || 'No messages yet...'}
                                            </p>
                                        </div>
                                        {isUnread && (
                                            <span className="shrink-0 text-xs font-black px-2.5 py-1 rounded-lg text-white"
                                                style={{ background: '#3F72AF' }}>
                                                New
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-16 bg-white rounded-2xl border flex flex-col items-center"
                        style={{ borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                            style={{ background: '#DBE2EF' }}>
                            <MessageSquare className="w-7 h-7" style={{ color: '#3F72AF' }} />
                        </div>
                        <p className="font-black mb-1" style={{ color: '#112D4E' }}>No conversations yet</p>
                        <p className="text-sm" style={{ color: '#6b84a0' }}>Connect with a peer first to start chatting.</p>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
