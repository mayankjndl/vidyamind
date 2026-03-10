// ===== Auth Store =====
// Simple localStorage-based auth

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    passwordHash: string; // simple hash for demo
    selectedExam: string;
    registeredAt: string;
}

interface AuthState {
    currentUser: UserProfile | null;
    users: UserProfile[];
    register: (name: string, email: string, password: string, examId: string) => { success: boolean; error?: string };
    login: (email: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    updateExam: (examId: string) => void;
}

// Simple hash for demo purposes (NOT cryptographically secure)
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [],

            register: (name, email, password, examId) => {
                const { users } = get();
                if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
                    return { success: false, error: "An account with this email already exists" };
                }
                if (!name.trim() || !email.trim() || !password.trim()) {
                    return { success: false, error: "All fields are required" };
                }
                if (password.length < 4) {
                    return { success: false, error: "Password must be at least 4 characters" };
                }

                const newUser: UserProfile = {
                    id: `user_${Date.now()}`,
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    passwordHash: simpleHash(password),
                    selectedExam: examId,
                    registeredAt: new Date().toISOString(),
                };

                set({ users: [...users, newUser], currentUser: newUser });
                return { success: true };
            },

            login: (email, password) => {
                const { users } = get();
                const user = users.find((u) => u.email === email.toLowerCase().trim());
                if (!user) {
                    return { success: false, error: "No account found with this email" };
                }
                if (user.passwordHash !== simpleHash(password)) {
                    return { success: false, error: "Incorrect password" };
                }
                set({ currentUser: user });
                return { success: true };
            },

            logout: () => {
                set({ currentUser: null });
            },

            updateExam: (examId) => {
                const { currentUser, users } = get();
                if (!currentUser) return;
                const updated = { ...currentUser, selectedExam: examId };
                set({
                    currentUser: updated,
                    users: users.map((u) => (u.id === currentUser.id ? updated : u)),
                });
            },
        }),
        {
            name: "vidyamind-auth",
        }
    )
);
