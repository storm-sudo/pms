'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { registerUser, isValidNTEmail } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dna, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        // Small delay for UX feel
        await new Promise(r => setTimeout(r, 400));

        const result = registerUser(name, email, password);

        if (result.success) {
            setSuccess(true);
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } else {
            setError(result.error || 'Registration failed');
        }

        setLoading(false);
    };

    const emailValid = email.length === 0 || isValidNTEmail(email);
    const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
    const passwordLongEnough = password.length === 0 || password.length >= 6;

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/30 via-slate-950 to-slate-950" />
                <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10 shadow-2xl">
                    <CardContent className="pt-10 pb-10 text-center space-y-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-50">Account Created!</h2>
                        <p className="text-slate-400 text-sm">
                            Your account has been created successfully.<br />
                            Redirecting you to the login page...
                        </p>
                        <div className="h-1 w-32 mx-auto bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full animate-[progress_2s_ease-in-out]"
                                style={{ animation: 'progress 2s ease-in-out forwards' }} />
                        </div>
                    </CardContent>
                </Card>
                <style jsx>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950" />

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10 shadow-2xl shadow-indigo-500/5">
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
                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-slate-800/50 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-email" className="text-slate-300">Email</Label>
                            <Input
                                id="reg-email"
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
                                    Email must end with &quot;nt@gmail.com&quot; (e.g. yournamecint@gmail.com)
                                </p>
                            )}
                            {emailValid && email.length > 0 && (
                                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Valid email format
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-password" className="text-slate-300">Password</Label>
                            <div className="relative">
                                <Input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`bg-slate-800/50 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 pr-10 ${!passwordLongEnough ? 'border-red-500/50' : ''
                                        }`}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {!passwordLongEnough && (
                                <p className="text-xs text-red-400 mt-1">Password must be at least 6 characters</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`bg-slate-800/50 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 ${!passwordsMatch ? 'border-red-500/50' : ''
                                    }`}
                                required
                            />
                            {!passwordsMatch && (
                                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !name || !email || !password || !confirmPassword || !emailValid || !passwordsMatch || !passwordLongEnough}
                            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                            <ArrowLeft className="h-3 w-3" />
                            Back to Sign In
                        </Link>
                    </div>

                    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                        <p className="text-xs text-slate-400 text-center">
                            <span className="text-slate-300 font-medium">Access Policy:</span> Only email addresses ending with <span className="text-blue-400 font-mono">nt@gmail.com</span> are permitted to register.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
