'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import apiFetch from '@/lib/fetcher';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      });

      setSent(true);
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
      toast.success('Reset token generated', {
        description: 'Check the details below to reset your password.',
      });
    } catch (error) {
      toast.error('Error', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            If an account with <span className="font-medium">{email}</span> exists,
            a reset token has been generated.
          </p>
        </div>

        {resetToken && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Reset Token (for testing):
            </p>
            <p className="text-sm font-mono break-all bg-white rounded p-2 border">
              {resetToken}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(resetToken);
                toast.success('Token copied to clipboard');
              }}
            >
              Copy Token
            </Button>
          </div>
        )}

        <Link href={`/reset-password?token=${encodeURIComponent(resetToken)}`}>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            Reset Password
          </Button>
        </Link>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </CardContent>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4 pt-6">
        <div className="text-center mb-2">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Forgot your password?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send you a reset token
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            aria-invalid={!!error}
            className={error ? 'border-rose-300 focus-visible:ring-rose-400' : ''}
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pb-6">
        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending...
            </span>
          ) : (
            'Send reset token'
          )}
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </CardFooter>
    </form>
  );
}
