import { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import { NotificationsProvider } from "@/context/NotificationsContext";

// App shell layout for authenticated users
export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <NotificationsProvider>
            <div className="flex flex-col min-h-screen w-full bg-transparent">
                <NavBar />
                <main className="flex-1 w-full flex flex-col">
                    {children}
                </main>
            </div>
        </NotificationsProvider>
    );
}
