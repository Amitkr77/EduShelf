'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiFetch from '@/lib/fetcher';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const newErrors = {};
    if (!token) {
      newErrors.token = 'Reset token is missing. Please use the link from your email.';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: {
          token,
          password: form.password,
        },
      });

      setSuccess(true);
      toast.success('Password reset successful!', {
        description: 'You can now sign in with your new password.',
      });

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      toast.error('Reset failed', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  const inputBase =
    'w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#5D7480] focus-visible:ring-offset-0 focus-visible:border-[#5D7480]';

  if (success) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7CCB7A]/15 mb-4">
            <CheckCircle2 className="h-8 w-8 text-[#7CCB7A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Password reset!</h2>
          <p className="text-sm text-[#6B7280] mt-1.5">
            Your password has been successfully reset. You&apos;ll be redirected to
            the login page shortly.
          </p>
        </div>

        <Link href="/login" className="block">
          <button
            type="button"
            className="w-full h-12 rounded-2xl bg-[#7C9AA5] hover:bg-[#5D7480] text-white font-semibold text-sm transition-colors duration-200"
          >
            Go to login
          </button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-[#1F2937]">Reset your password</h2>
        <p className="text-sm text-[#6B7280] mt-1.5">
          Enter your new password below
        </p>
      </div>

      {/* Missing token warning */}
      {!token && (
        <div className="rounded-xl border border-[#F28B82]/40 bg-[#F28B82]/8 p-4">
          <p className="text-sm text-[#F28B82]">
            No reset token found. Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#F28B82] underline hover:text-[#D97373] transition-colors duration-200 mt-1 inline-block"
          >
            Request reset link
          </Link>
        </div>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[#1F2937]"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            aria-invalid={!!errors.password}
            className={`${inputBase} pr-11 ${
              errors.password ? 'border-[#F28B82] focus-visible:ring-[#F28B82] focus-visible:border-[#F28B82]' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors duration-200 p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-[#F28B82] mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-[#1F2937]"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm your new password"
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            aria-invalid={!!errors.confirmPassword}
            className={`${inputBase} pr-11 ${
              errors.confirmPassword ? 'border-[#F28B82] focus-visible:ring-[#F28B82] focus-visible:border-[#F28B82]' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1F2937] transition-colors duration-200 p-1"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-[#F28B82] mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full h-12 rounded-2xl bg-[#7C9AA5] hover:bg-[#5D7480] text-white font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Resetting...
          </>
        ) : (
          'Reset password'
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#7C9AA5]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
