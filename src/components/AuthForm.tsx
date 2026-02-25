'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  // Capture referral code from URL on the auth pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      document.cookie = `ref_code=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, []);

  if (status === 'loading' || status === 'authenticated') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          setError('Registration successful, but login failed. Please try logging in.');
        } else {
          router.push('/#pricing');
        }
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: mode === 'register' ? '/#pricing' : '/dashboard' });
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md p-8 space-y-5">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl">🦀</span>
            <span className="text-sm font-bold gradient-text">ClawSetup</span>
          </div>
          <h2 className="text-2xl font-bold text-white/90">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-[13px] text-white/35 mt-1">
            {mode === 'login' ? 'Sign in to continue to your dashboard' : 'Get started with OpenClaw in minutes'}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400">
            {error}
          </div>
        )}

        {/* Google button first */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-white/70 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-[11px] text-white/25 bg-[rgb(10,11,16)]">or continue with email</span>
          </div>
        </div>

        {/* Form fields */}
        {mode === 'register' && (
          <div>
            <label className="block text-[12px] font-medium text-white/40 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.04] transition-all"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-[12px] font-medium text-white/40 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.04] transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-white/40 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.04] transition-all"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, rgb(255,79,90), rgb(255,138,92))' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Processing...
            </span>
          ) : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p className="text-center text-[12px] text-white/30">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <a
            href={mode === 'login' ? '/auth/register' : '/auth/login'}
            className="text-[rgb(255,79,90)] hover:text-[rgb(255,138,92)] transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </form>
    </div>
  );
}
