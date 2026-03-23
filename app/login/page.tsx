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
import { Dna, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const { setLoggedIn, setCurrentUser, users } = useApp();
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

        const result = loginUser(email, password);

        if (result.success && result.user) {
            const existingUser = users.find(u => u.email.toLowerCase() === result.user!.email.toLowerCase());

            const mappedUser: User = existingUser || {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: 'member', // Default role
                department: 'Mol Bio',
                joinedDate: result.user.createdAt,
                lastActive: new Date().toISOString(),
                workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
            };

            setCurrentUser(mappedUser);
            setLoggedIn(true);
            router.push('/');
        } else {
            setError(result.error || 'Login failed');
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
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                        <Dna className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-50">Welcome to Synapse</CardTitle>
                    <CardDescription className="text-slate-400">
                        Sign in to your account to continue
                    </CardDescription>
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
                                placeholder="yourname-nt@gmail.com"
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
                        Access restricted to authorized NucleoVir team members
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
