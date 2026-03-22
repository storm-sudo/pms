'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dna } from 'lucide-react';

export default function LoginPage() {
  const { setLoggedIn } = useApp();
  const router = useRouter();

  const handleGoogleLogin = () => {
    setLoggedIn(true);
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950" />
      
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
            <Dna className="h-6 w-6 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Synapse</CardTitle>
          <CardDescription className="text-slate-400">
            High-accountability Project Management For Biotech
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button 
            onClick={handleGoogleLogin} 
            className="w-full h-12 gap-3 bg-white hover:bg-slate-100 text-slate-900 font-medium transition-all duration-200 shadow-lg shadow-white/10"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
          <div className="mt-6 text-center text-xs text-slate-500">
            By clicking continue, you agree to our terms of service
          </div>
        </CardContent>
      </Card>
    </div>
  );}
