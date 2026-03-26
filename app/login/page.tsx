'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { loginUser, isValidNTEmail } from '@/lib/auth';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';

export default function LoginPage() {
    const { login, setLoggedIn, setCurrentUser, users } = useApp();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Small delay for UX feel
        await new Promise(r => setTimeout(r, 400));

        // 1. Try our mock-data login (which handles the provided shahebaazkazi002nt@gmail.com)
        const success = login(email, password);
        
        if (success) {
            toast.success('Logged in successfully');
            router.push('/');
        } else {
            // 2. Fallback to lib/auth.ts (localStorage) login if mock-data fails
            const result = loginUser(email, password);
            if (result.success && result.user) {
                const existingUser = users.find(u => u.email.toLowerCase() === result.user!.email.toLowerCase());

                const mappedUser: User = existingUser || {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: 'member', // Default role for manual registrations
                    department: 'Mol Bio',
                    joinedDate: result.user.createdAt,
                    lastActive: new Date().toISOString(),
                    status: result.user.status || 'pending',
                    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
                };

                setCurrentUser(mappedUser);
                setLoggedIn(true);
                toast.success('Logged in successfully');
                router.push('/');
            } else {
                setError(result.error || 'Invalid email or password');
                toast.error('Login failed');
            }
        }

        setLoading(false);
    };

    const emailValid = email.length === 0 || isValidNTEmail(email);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950" />

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10 shadow-2xl shadow-blue-500/5">
                <CardHeader className="text-center space-y-4 pt-8">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-2 shadow-2xl shadow-blue-500/20 ring-4 ring-slate-900/50 transition-transform hover:scale-105 duration-300">
                        <Image 
                            src="/logo.jpg" 
                            alt="NucleoVir Logo" 
                            width={96} 
                            height={96} 
                            className="object-contain w-full h-full rounded-2xl"
                        />
                    </div>
                    <CardTitle className="text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-slate-50 to-slate-400">
                        SYNAPSE
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="shahebaazkazi002nt@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`bg-slate-800/50 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 ${!emailValid ? 'border-red-500/50 focus:border-red-500' : ''
                                    }`}
                                required
                            />
                            {!emailValid && (
                                <p className="text-xs text-red-400 mt-1">
                                    Email must end with &quot;nt@gmail.com&quot;
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-slate-800/50 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !email || !password || !emailValid}
                            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    Sign In
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center space-y-3">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-900/50 px-2 text-slate-500">New here?</span>
                            </div>
                        </div>
                        <Link href="/register">
                            <Button
                                variant="outline"
                                className="w-full h-11 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-50 hover:border-slate-600 transition-all duration-200"
                            >
                                Create an Account
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-5 text-center text-xs text-slate-500">
                        Demo Credentials: shahebaazkazi002nt@gmail.com / dmin123
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
