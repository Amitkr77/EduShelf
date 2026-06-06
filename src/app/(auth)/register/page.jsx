'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiFetch from '@/lib/fetcher';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
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
      await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      });

      const loginRes = await apiFetch('/auth/login', {
        method: 'POST',
        body: {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      });

      toast.success('Account created!', {
        description: `Welcome to EduShelf, ${loginRes.data.user.name}!`,
      });

      router.push('/student/dashboard');
    } catch (error) {
      toast.error('Registration failed', { description: error.message });
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-2xl font-bold text-[#1F2937]">Create your account</h2>
        <p className="text-sm text-[#6B7280] mt-1.5">
          Join EduShelf as a student
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-[#1F2937]"
        >
          Full Name
        </label>
        <input
          id="name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          aria-invalid={!!errors.name}
          className={`${inputBase} ${
            errors.name ? 'border-[#F28B82] focus-visible:ring-[#F28B82] focus-visible:border-[#F28B82]' : ''
          }`}
        />
        {errors.name && (
          <p className="text-xs text-[#F28B82] mt-1">{errors.name}</p>
        )}
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
        <label
          htmlFor="password"
          className="text-sm font-medium text-[#1F2937]"
        >
          Password
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
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm your password"
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
        disabled={loading}
        className="w-full h-12 rounded-2xl bg-[#7C9AA5] hover:bg-[#5D7480] text-white font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </button>

      {/* Footer link */}
      <p className="text-sm text-[#6B7280] text-center">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[#7C9AA5] hover:text-[#5D7480] font-medium transition-colors duration-200"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
