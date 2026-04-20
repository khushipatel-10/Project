"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const LS_KEY = "synapse_thread_reads";

interface ThreadData { id: string; lastMessageAt: string; lastSenderId: string }

interface NotificationsContextValue {
    pendingConnections: number;
    unreadMessages: number;
    markThreadRead: (threadId: string) => void;
    refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
    pendingConnections: 0,
    unreadMessages: 0,
    markThreadRead: () => {},
    refresh: () => {}
});

function getReadMap(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}

function computeUnread(threads: ThreadData[], myUserId: string): number {
    const reads = getReadMap();
    return threads.filter(t => {
        if (t.lastSenderId === myUserId) return false;
        const lastRead = reads[t.id];
        if (!lastRead) return true;
        return new Date(t.lastMessageAt) > new Date(lastRead);
    }).length;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [pendingConnections, setPendingConnections] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [threads, setThreads] = useState<ThreadData[]>([]);
    const [myUserId, setMyUserId] = useState("");

    const fetchCounts = useCallback(async () => {
        if (!isLoaded || !isSignedIn) return;
        try {
            const token = await getToken();
            const res = await fetch(`${API}/me/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setPendingConnections(data.data.pendingConnections);
                    setMyUserId(data.data.myUserId);
                    setThreads(data.data.threads);
                    setUnreadMessages(computeUnread(data.data.threads, data.data.myUserId));
                }
            }
        } catch {}
    }, [isLoaded, isSignedIn, getToken]);

    useEffect(() => {
        fetchCounts();
        const interval = setInterval(fetchCounts, 20000);
        return () => clearInterval(interval);
    }, [fetchCounts]);

    const markThreadRead = useCallback((threadId: string) => {
        const reads = getReadMap();
        reads[threadId] = new Date().toISOString();
        localStorage.setItem(LS_KEY, JSON.stringify(reads));
        // Recompute unread immediately without refetching
        setUnreadMessages(computeUnread(threads, myUserId));
    }, [threads, myUserId]);

    return (
        <NotificationsContext.Provider value={{ pendingConnections, unreadMessages, markThreadRead, refresh: fetchCounts }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationsContext);
