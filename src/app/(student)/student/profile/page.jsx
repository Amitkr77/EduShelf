'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Save,
  Camera,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  // Editable form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiFetch('/auth/me');
        const userData = res.data.user;
        setUser(userData);
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setDepartment(userData.department || '');
        setAvatar(userData.avatar || '');
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSaveProfile() {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(`/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim(),
          avatar: avatar.trim(),
        }),
      });
      setUser(res.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  function getInitials(name) {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280]">Unable to load profile data.</p>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-4 sm:space-y-6 max-w-3xl">
      {/* Header */}
      {/* <div>
        <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">My Profile</h1>
        <p className="text-sm sm:text-base text-[#6B7280] mt-1">
          Manage your personal information and account settings.
        </p>
      </div> */}

      {/* Profile Overview Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative group">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-[#DDE7EA]">
              {avatar ? (
                <AvatarImage src={avatar} alt={name} />
              ) : null}
              <AvatarFallback className="bg-[#DDE7EA] text-[#5D7480] text-xl sm:text-2xl font-bold border-0">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">{user.name}</h2>
            <p className="text-sm sm:text-base text-[#6B7280]">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium bg-[#DDE7EA] text-[#5D7480]">
                <GraduationCap className="h-3 w-3" />
                Student
              </span>
              {user.studentId && (
                <span className="inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-medium bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]">
                  ID: {user.studentId}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-medium ${
                  user.status === 'active'
                    ? 'bg-[#E8F0EC] text-[#6B8F83]'
                    : 'bg-[#F9FAFB] text-[#6B7280]'
                }`}
              >
                {user.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="p-3 sm:p-4 md:p-6 pb-2">
          <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">Edit Profile</h2>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Update your personal information.
          </p>
        </div>
        <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6B7280]">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6B7280]">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]"
              />
              <p className="text-xs text-[#6B7280]">
                Email cannot be changed.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6B7280]">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6B7280]">
                <Building2 className="h-4 w-4" />
                Department
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enter your department"
                className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]"
              />
            </div>
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatar" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6B7280]">
              <Camera className="h-4 w-4" />
              Avatar URL
            </Label>
            <Input
              id="avatar"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="Enter avatar image URL"
              className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]"
            />
          </div>

          {/* Student ID (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="studentId" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6B7280]">
              <GraduationCap className="h-4 w-4" />
              Student ID
            </Label>
            <Input
              id="studentId"
              value={user.studentId || 'Not assigned'}
              disabled
              className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-xl sm:rounded-2xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password - Separate Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div
          className="p-3 sm:p-4 md:p-6 pb-2 cursor-pointer flex items-center justify-between"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
        >
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1F2937] flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#5D7480]" />
              Change Password
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Update your account password for security.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-[#6B7280] hover:bg-transparent">
            {showPasswordSection ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {showPasswordSection && (
          <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-4">
            <Separator className="bg-[#E5E7EB]" />

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs sm:text-sm font-medium text-[#6B7280]">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480] pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-[#6B7280]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#6B7280]" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs sm:text-sm font-medium text-[#6B7280]">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480] pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-[#6B7280]" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#6B7280]" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium text-[#6B7280]">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-[#C25B4F]">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                className="bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-xl sm:rounded-2xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
              >
                <Lock className="h-4 w-4 mr-2" />
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="p-3 sm:p-4 md:p-6 pb-2">
          <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">Account Information</h2>
        </div>
        <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280]">Account Created:</span>
              <span className="font-medium text-[#1F2937]">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280]">Last Updated:</span>
              <span className="font-medium text-[#1F2937]">
                {user.updatedAt
                  ? new Date(user.updatedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
