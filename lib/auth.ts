import { supabase } from './supabase';
import { notificationService } from './notifications';

// ── Email validation ──
export function isValidNTEmail(email: string): boolean {
    return email.toLowerCase().endsWith('nt@gmail.com');
}

export interface RegisteredUser {
    id: string;
    name: string;
    email: string;
    password: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const SESSION_KEY = 'synapse-session';

// ── Registration ──
export async function registerUser(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!name.trim()) return { success: false, error: 'Name is required' };
    if (!normalizedEmail) return { success: false, error: 'Email is required' };
    if (!isValidNTEmail(normalizedEmail)) return { success: false, error: 'Only emails ending with "nt@gmail.com" are allowed.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

    // Check if user already exists in Supabase
    const { data: existing } = await supabase.from('profiles').select('email').eq('email', normalizedEmail).single();
    if (existing) return { success: false, error: 'An account with this email already exists' };

    const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        password, // Hashing should be done in a real system
        status: 'pending',
        joined_date: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').insert([newUser]);
    if (error) return { success: false, error: error.message };

    notificationService.sendEmail(
        'shahebaazkazi002nt@gmail.com',
        'SYNAPSE: New User Registration',
        `A new user registered: ${newUser.name} (${newUser.email})`
    );

    return { success: true };
}

// ── Login ──
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const { data: user, error } = await supabase.from('profiles')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('password', password)
        .single();

    if (error || !user) return { success: false, error: 'Invalid email or password' };
    if (user.status !== 'approved') return { success: false, error: 'Account pending approval' };

    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, email: user.email }));
    return { success: true, user };
}

// ── Session ──
export function getSession(): { userId: string; email: string } | null {
    if (typeof window === 'undefined') return null;
    try {
        const data = localStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export function logoutUser(): void {
    localStorage.removeItem(SESSION_KEY);
}
