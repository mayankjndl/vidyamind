"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { currentUser } = useAuthStore();
    const router = useRouter();
    const marginLeft = collapsed ? 68 : 240;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (mounted && !currentUser) {
            router.push("/auth");
        }
    }, [mounted, currentUser, router]);

    if (!mounted || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--vm-border)", borderTopColor: "var(--vm-accent)" }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <main
                className="min-h-screen p-6 lg:p-8 transition-all duration-[250ms] ease-in-out"
                style={{ marginLeft }}
            >
                {children}
            </main>
        </div>
    );
}
