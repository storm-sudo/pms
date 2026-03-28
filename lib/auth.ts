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

// ── Registration ──
export async function registerUser(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (!name.trim()) return { success: false, error: 'Name is required' };
    if (!normalizedEmail) return { success: false, error: 'Email is required' };
    if (!isValidNTEmail(normalizedEmail)) return { success: false, error: 'Only emails ending with "nt@gmail.com" are allowed.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

    // Register with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
            data: {
                name: name.trim()
            }
        }
    });

    if (error) return { success: false, error: error.message };

    // The handle_new_user() trigger in Postgres will automatically create the profile row
    
    // Fetch an admin user to notify (e.g., the first one found or a fixed ID if known)
    // For now, notifying a fixed clinical lead ID or first admin
    const profiles = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1);
    if (profiles.data?.[0]) {
        await notificationService.sendNotification('account_registered', profiles.data[0].id, {
            data: { name, email: normalizedEmail }
        });
    }

    return { success: true };
}

// ── Login ──
export async function loginUser(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
    });

    if (error) return { success: false, error: error.message };
    
    // Fetch profile data for state consistency
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile) return { success: false, error: 'Profile not found' };
    if (profile.status !== 'approved') return { success: false, error: 'Account pending approval' };

    return { success: true, user: profile };
}

// ── Session ──
export async function getSession(): Promise<{ userId: string; email: string } | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    
    return {
        userId: session.user.id,
        email: session.user.email || ''
    };
}

export async function logoutUser(): Promise<void> {
    await supabase.auth.signOut();
}
