'use client';

import { notificationService } from './notifications';

// ── Email validation ──
// Only emails ending with "nt@gmail.com" are allowed (e.g. swatint@gmail.com)
export function isValidNTEmail(email: string): boolean {
    return email.toLowerCase().endsWith('nt@gmail.com');
}

// ── Registered user account stored in localStorage ──
export interface RegisteredUser {
    id: string;
    name: string;
    email: string;
    password: string; // In production, this would be hashed
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const STORAGE_KEY = 'synapse-registered-users';
const SESSION_KEY = 'synapse-session';

function getRegisteredUsers(): RegisteredUser[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveRegisteredUsers(users: RegisteredUser[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ── Registration ──
export function registerUser(name: string, email: string, password: string): { success: boolean; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();

    if (!name.trim()) {
        return { success: false, error: 'Name is required' };
    }

    if (!normalizedEmail) {
        return { success: false, error: 'Email is required' };
    }

    if (!isValidNTEmail(normalizedEmail)) {
        return { success: false, error: 'Only emails ending with "nt@gmail.com" are allowed (e.g. yournamecint@gmail.com)' };
    }

    if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
    }

    const users = getRegisteredUsers();

    if (users.some(u => u.email === normalizedEmail)) {
        return { success: false, error: 'An account with this email already exists' };
    }

    const newUser: RegisteredUser = {
        id: `user_${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        email: normalizedEmail,
        password, // In production, hash this!
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    // Notify Admin of new registration
    notificationService.sendEmail(
        'shahebaazkazi002nt@gmail.com',
        'SYNAPSE: New User Registration',
        `A new user has registered for Synapse and is pending approval.<br><br>
        <strong>Name:</strong> ${newUser.name}<br>
        <strong>Email:</strong> ${newUser.email}<br><br>
        Please log in to the portal to approve or reject this request.`
    );

    return { success: true };
}

// ── Admin-created registration ──
export function registerUserByAdmin(user: RegisteredUser): void {
    const users = getRegisteredUsers();
    if (!users.some(u => u.id === user.id || u.email === user.email)) {
        users.push(user);
        saveRegisteredUsers(users);
    }
}

// ── Login ──
export function loginUser(email: string, password: string): { success: boolean; user?: RegisteredUser; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail) {
        return { success: false, error: 'Email is required' };
    }

    if (!isValidNTEmail(normalizedEmail)) {
        return { success: false, error: 'Only emails ending with "nt@gmail.com" can access this portal' };
    }

    if (!password) {
        return { success: false, error: 'Password is required' };
    }

    const users = getRegisteredUsers();
    const user = users.find(u => u.email === normalizedEmail && u.password === password);

    if (!user) {
        return { success: false, error: 'Invalid email or password' };
    }

    // Save session
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

export function getLoggedInUser(): RegisteredUser | null {
    const session = getSession();
    if (!session) return null;
    const users = getRegisteredUsers();
    return users.find(u => u.id === session.userId) || null;
}
