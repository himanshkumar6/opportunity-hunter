'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setErrorMsg('An account with this email already exists.');
        setLoading(false);
        return;
      }

      setSuccessMsg(
        'Account created successfully! Please check your email for the confirmation link before signing in.'
      );
      setLoading(false);
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#090D16] py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-900/30">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Opportunity Hunter</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Get started with automated opportunity discovery
        </p>
      </div>

      <div className="mt-8 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="rounded-xl border border-slate-800 bg-[#0E1526] px-6 py-8 shadow-xl sm:px-10">
          {errorMsg && (
            <div
              role="alert"
              data-testid="auth-error-alert"
              className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-6 flex items-start gap-2.5 rounded-lg border border-emerald-800/80 bg-emerald-950/60 p-3 text-xs text-emerald-200"
            >
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="operator@company.com"
                  className="w-full rounded-lg border border-slate-800 bg-[#090D16] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-slate-800 bg-[#090D16] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-medium text-slate-300"
              >
                Confirm password
              </label>
              <div className="mt-1.5">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-slate-800 bg-[#090D16] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition focus:border-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg border border-transparent bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-950 transition hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
