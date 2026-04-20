"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, UserPlus, LogOut, ArrowRight, X } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import Link from "next/link";

const HUB_GRADIENTS = [
    'linear-gradient(135deg, #3F72AF, #112D4E)',
    'linear-gradient(135deg, #4a8c42, #2d5a27)',
    'linear-gradient(135deg, #D4974A, #9B6B30)',
    'linear-gradient(135deg, #6d4fc7, #4c3490)',
    'linear-gradient(135deg, #112D4E, #1e3f6b)',
];

export default function CommunityHubsPage() {
    const { getToken, isLoaded } = useAuth();
    const [hubs, setHubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newHubName, setNewHubName] = useState("");
    const [hubError, setHubError] = useState("");

    useEffect(() => {
        async function fetchHubs() {
            if (!isLoaded) return;
            try {
                const token = await getToken();
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) { const d = await res.json(); if (d.success) setHubs(d.data || []); }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchHubs();
    }, [isLoaded, getToken]);

    const handleJoin = async (hubId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs/${hubId}/join`, {
                method: "POST", headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHubs(prev => prev.map(h => h.id === hubId ? { ...h, userStatus: data.status, memberCount: h.memberCount + (data.status === 'member' ? 1 : 0) } : h));
            }
        } catch (e) { console.error(e); }
    };

    const handleLeave = async (hubId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs/${hubId}/leave`, {
                method: "POST", headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setHubs(prev => prev.map(h => h.id === hubId ? { ...h, userStatus: 'none', memberCount: Math.max(0, h.memberCount - 1) } : h));
        } catch (e) { console.error(e); }
    };

    const handleCreateHub = async () => {
        if (!newHubName.trim()) return;
        try {
            const token = await getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/community/hubs`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newHubName })
            });
            if (res.ok) { setIsCreating(false); setNewHubName(""); setHubError(""); window.location.reload(); }
            else setHubError("Failed to create hub. Try a different name.");
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <PageShell>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {[0,1,2].map(i => <div key={i} className="h-52 rounded-2xl skeleton" />)}
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            {/* Create modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(17,45,78,0.5)', backdropFilter: 'blur(6px)' }}
                    onClick={() => { setIsCreating(false); setHubError(""); }}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md"
                        style={{ boxShadow: '0 24px 60px rgba(17,45,78,0.2)', border: '1px solid #DBE2EF' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black" style={{ color: '#112D4E' }}>Create New Hub</h2>
                            <button onClick={() => { setIsCreating(false); setHubError(""); }} style={{ color: '#6b84a0' }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input type="text" placeholder="e.g. Graph Theory Night Owls"
                            className="w-full px-4 py-3 rounded-xl outline-none mb-4"
                            style={{ border: '1px solid #DBE2EF', color: '#112D4E', background: 'white' }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#3F72AF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(63,114,175,0.1)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = '#DBE2EF'; e.currentTarget.style.boxShadow = 'none'; }}
                            value={newHubName} onChange={e => setNewHubName(e.target.value)} />
                        {hubError && <p className="text-sm mb-3 font-semibold" style={{ color: '#be123c' }}>{hubError}</p>}
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" className="rounded-xl" onClick={() => { setIsCreating(false); setHubError(""); }}>Cancel</Button>
                            <Button onClick={handleCreateHub} className="rounded-xl font-black text-white border-0"
                                style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)' }}>
                                Create Hub
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: '#112D4E' }}>
                        <Users className="w-8 h-8" style={{ color: '#3F72AF' }} /> Community Hubs
                    </h1>
                    <p className="text-lg mt-1.5" style={{ color: '#2b4a70' }}>
                        Discover algorithmic study groups formed around structural complementary traits.
                    </p>
                </div>
                <Button onClick={() => setIsCreating(true)}
                    className="rounded-xl font-black text-white border-0 transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #3F72AF, #112D4E)', boxShadow: '0 4px 14px rgba(63,114,175,0.35)' }}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add New Hub
                </Button>
            </div>

            {hubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hubs.map((hub, idx) => {
                        const gradient = HUB_GRADIENTS[idx % HUB_GRADIENTS.length];
                        return (
                            <div key={hub.id} className="card-hover bg-white rounded-2xl overflow-hidden flex flex-col"
                                style={{ border: '1px solid #DBE2EF', boxShadow: '0 2px 12px rgba(17,45,78,0.06)' }}>
                                <div className="h-1.5 w-full" style={{ background: gradient }} />
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-black" style={{ color: '#112D4E' }}>{hub.name}</h3>
                                        <span className="text-xs font-bold px-2 py-1 rounded-lg"
                                            style={{ background: '#DBE2EF', color: '#3F72AF' }}>
                                            {hub.memberCount || 0}/6
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        {hub.userStatus === 'member' ? (
                                            <>
                                                <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: '#6b84a0' }}>Members</p>
                                                <div className="text-sm p-3 rounded-xl border" style={{ background: '#F9F7F7', borderColor: '#DBE2EF', color: '#2b4a70' }}>
                                                    {hub.members?.length > 0 ? hub.members.map((m: any) => m.name).join(', ') : 'No members yet.'}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm italic" style={{ color: '#6b84a0' }}>Join this hub to see the active member list.</p>
                                        )}
                                    </div>

                                    <div className="mt-5 pt-4 border-t flex flex-col gap-2" style={{ borderColor: '#DBE2EF' }}>
                                        {hub.userStatus === 'member' ? (
                                            <>
                                                <Link href={`/app/community/hubs/${hub.id}`} className="w-full">
                                                    <Button className="w-full font-black text-white border-0 rounded-xl transition-all hover:-translate-y-0.5"
                                                        style={{ background: gradient, boxShadow: '0 4px 12px rgba(63,114,175,0.25)' }}>
                                                        Enter Hub <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" className="w-full rounded-xl font-semibold text-sm hover:bg-red-50"
                                                    style={{ color: '#be123c' }} onClick={() => handleLeave(hub.id)}>
                                                    <LogOut className="w-4 h-4 mr-2" /> Leave Hub
                                                </Button>
                                            </>
                                        ) : hub.userStatus === 'pending' ? (
                                            <Button variant="outline" className="w-full rounded-xl font-semibold"
                                                style={{ borderColor: '#ECC880', color: '#9B6B30' }} onClick={() => handleLeave(hub.id)}>
                                                Withdraw Request
                                            </Button>
                                        ) : (
                                            <Button className="w-full rounded-xl font-black border"
                                                style={{ background: 'white', borderColor: '#DBE2EF', color: '#112D4E' }}
                                                onClick={() => handleJoin(hub.id)} disabled={hub.memberCount >= 6}>
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                {hub.memberCount >= 6 ? 'Hub Full' : 'Join Hub'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-2xl border"
                    style={{ borderColor: '#DBE2EF', boxShadow: '0 4px 16px rgba(17,45,78,0.06)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                        style={{ background: '#DBE2EF' }}>
                        <Users className="w-8 h-8" style={{ color: '#3F72AF' }} />
                    </div>
                    <h3 className="text-xl font-black mb-2" style={{ color: '#112D4E' }}>No hubs yet</h3>
                    <p className="max-w-sm mb-6 leading-relaxed" style={{ color: '#2b4a70' }}>
                        Hubs appear after more users join the course or an active formation is run.
                    </p>
                </div>
            )}
        </PageShell>
    );
}
