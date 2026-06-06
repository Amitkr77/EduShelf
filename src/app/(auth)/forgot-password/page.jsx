'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, Loader2, Copy } from 'lucide-react';
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
    } catch (err) {
      toast.error('Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    'w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#5D7480] focus-visible:ring-offset-0 focus-visible:border-[#5D7480]';

  if (sent) {
    return (
      <div className="space-y-5">
        {/* Success header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7CCB7A]/15 mb-4">
            <CheckCircle2 className="h-8 w-8 text-[#7CCB7A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Check your email</h2>
          <p className="text-sm text-[#6B7280] mt-1.5 max-w-xs">
            If an account with <span className="font-medium text-[#1F2937]">{email}</span> exists,
            a reset token has been generated.
          </p>
        </div>

        {/* Reset token display */}
        {resetToken && (
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 space-y-3">
            <p className="text-xs font-medium text-[#6B7280]">
              Reset Token (for testing):
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono break-all bg-white rounded-lg p-2.5 border border-[#E5E7EB] flex-1 text-[#1F2937]">
                {resetToken}
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resetToken);
                  toast.success('Token copied to clipboard');
                }}
                className="flex items-center justify-center h-9 w-9 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#1F2937] hover:border-[#5D7480] transition-colors duration-200 shrink-0"
                aria-label="Copy token"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Reset password button */}
        <Link href={`/reset-password?token=${encodeURIComponent(resetToken)}`} className="block">
          <button
            type="button"
            className="w-full h-12 rounded-2xl bg-[#7C9AA5] hover:bg-[#5D7480] text-white font-semibold text-sm transition-colors duration-200"
          >
            Reset Password
          </button>
        </Link>

        {/* Back to login */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7C9AA5]/10">
            <Mail className="h-6 w-6 text-[#7C9AA5]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#1F2937]">Forgot your password?</h2>
        <p className="text-sm text-[#6B7280] mt-1.5">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[#1F2937]"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          aria-invalid={!!error}
          className={`${inputBase} ${
            error ? 'border-[#F28B82] focus-visible:ring-[#F28B82] focus-visible:border-[#F28B82]' : ''
          }`}
        />
        {error && (
          <p className="text-xs text-[#F28B82] mt-1">{error}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-2xl bg-[#7C9AA5] hover:bg-[#5D7480] text-white font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send reset link'
        )}
      </button>

      {/* Back to login */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </form>
  );
}
