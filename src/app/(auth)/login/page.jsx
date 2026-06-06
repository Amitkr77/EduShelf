'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiFetch from '@/lib/fetcher';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      });

      const user = res.data.user;
      toast.success('Welcome back!', { description: `Logged in as ${user.name}` });

      if (user.role === 'librarian' || user.role === 'admin') {
        router.push('/librarian/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (error) {
      toast.error('Login failed', { description: error.message });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1F2937]">Welcome back</h2>
        <p className="text-sm text-[#6B7280] mt-1.5">
          Sign in to your EduShelf account
        </p>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[#1F2937]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          aria-invalid={!!errors.email}
          className={`${inputBase} ${
            errors.email ? 'border-[#F28B82] focus-visible:ring-[#F28B82] focus-visible:border-[#F28B82]' : ''
          }`}
        />
        {errors.email && (
          <p className="text-xs text-[#F28B82] mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[#1F2937]"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-[#7C9AA5] hover:text-[#5D7480] font-medium transition-colors duration-200"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
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

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-2xl bg-[#7C9AA5] hover:bg-[#5D7480] text-white font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>

      {/* Footer link */}
      <p className="text-sm text-[#6B7280] text-center">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-[#7C9AA5] hover:text-[#5D7480] font-medium transition-colors duration-200"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
