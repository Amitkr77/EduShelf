'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  BellOff,
  BookOpen,
  AlertTriangle,
  CalendarCheck,
  DollarSign,
  CheckCircle2,
  Info,
  CheckCheck,
  Filter,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const typeIcons = {
  due_reminder: Clock,
  overdue_alert: AlertTriangle,
  reservation_update: CalendarCheck,
  new_book: BookOpen,
  fine: DollarSign,
  borrow_approved: CheckCircle2,
  borrow_rejected: AlertTriangle,
  general: Info,
};

const typeColors = {
  due_reminder: 'bg-[#FEF3E2] text-[#C4952A]',
  overdue_alert: 'bg-[#FDE8E6] text-[#C25B4F]',
  reservation_update: 'bg-[#DDE7EA] text-[#5D7480]',
  new_book: 'bg-[#E8F0EC] text-[#6B8F83]',
  fine: 'bg-[#FDE8E6] text-[#C25B4F]',
  borrow_approved: 'bg-[#E8F0EC] text-[#6B8F83]',
  borrow_rejected: 'bg-[#FDE8E6] text-[#C25B4F]',
  general: 'bg-[#F9FAFB] text-[#6B7280]',
};

const typeBadgeColors = {
  due_reminder: 'bg-[#FEF3E2] text-[#C4952A]',
  overdue_alert: 'bg-[#FDE8E6] text-[#C25B4F]',
  reservation_update: 'bg-[#E3F2FA] text-[#4A8DB7]',
  new_book: 'bg-[#E8F0EC] text-[#6B8F83]',
  fine: 'bg-[#FDE8E6] text-[#C25B4F]',
  borrow_approved: 'bg-[#E8F0EC] text-[#6B8F83]',
  borrow_rejected: 'bg-[#FDE8E6] text-[#C25B4F]',
  general: 'bg-[#F9FAFB] text-[#6B7280]',
};

const typeLabels = {
  due_reminder: 'Due Reminder',
  overdue_alert: 'Overdue Alert',
  reservation_update: 'Reservation',
  new_book: 'New Book',
  fine: 'Fine',
  borrow_approved: 'Borrow Approved',
  borrow_rejected: 'Borrow Rejected',
  general: 'General',
};

function groupNotificationsByDate(notifications) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const groups = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    if (date >= today) {
      groups.today.push(notification);
    } else if (date >= yesterday) {
      groups.yesterday.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  return groups;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '/notifications?limit=100';
      if (filterType && filterType !== 'all') {
        endpoint += `&type=${filterType}`;
      }
      const res = await apiFetch(endpoint);
      setNotifications(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleMarkAsRead(notificationId) {
    try {
      await apiFetch(`/notifications/${notificationId}`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: !n.isRead } : n
        )
      );
    } catch (error) {
      toast.error('Failed to update notification');
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true);
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unread.map((n) =>
          apiFetch(`/notifications/${n._id}`, { method: 'PUT' })
        )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const grouped = groupNotificationsByDate(notifications);

  if (loading) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  return (
    <div className="page-enter space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">Notifications</h1>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1">
            Stay updated with your library activity.
            {unreadCount > 0 && (
              <span className="ml-1 text-[#5D7480] font-medium">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter */}
          <Select
            value={filterType}
            onValueChange={setFilterType}
          >
            <SelectTrigger className="w-full sm:w-44 h-11 sm:h-10 rounded-xl bg-[#F9FAFB] border-[#E5E7EB] focus-visible:ring-2 focus-visible:ring-[#5D7480]">
              <Filter className="h-4 w-4 mr-2 text-[#6B7280]" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="due_reminder">Due Reminder</SelectItem>
              <SelectItem value="overdue_alert">Overdue Alert</SelectItem>
              <SelectItem value="reservation_update">Reservation</SelectItem>
              <SelectItem value="fine">Fine</SelectItem>
              <SelectItem value="borrow_approved">Borrow Approved</SelectItem>
              <SelectItem value="borrow_rejected">Borrow Rejected</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 rounded-xl sm:rounded-2xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              {markingAll ? 'Marking...' : 'Mark All Read'}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          description={
            filterType !== 'all'
              ? `No ${typeLabels[filterType] || filterType} notifications found.`
              : "You're all caught up! Notifications will appear here."
          }
          actionLabel={
            filterType !== 'all' ? 'Clear Filter' : undefined
          }
          onAction={
            filterType !== 'all' ? () => setFilterType('all') : undefined
          }
        />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {['today', 'yesterday', 'earlier'].map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;

            return (
              <div key={group}>
                <h3 className="text-xs sm:text-sm font-semibold text-[#6B7280] mb-2 sm:mb-3 uppercase tracking-wider">
                  {group === 'today'
                    ? 'Today'
                    : group === 'yesterday'
                    ? 'Yesterday'
                    : 'Earlier'}
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {items.map((notification) => {
                    const Icon = typeIcons[notification.type] || Info;
                    const color =
                      typeColors[notification.type] || 'bg-[#F9FAFB] text-[#6B7280]';
                    const badgeColor =
                      typeBadgeColors[notification.type] || 'bg-[#F9FAFB] text-[#6B7280]';

                    return (
                      <div
                        key={notification._id}
                        className={`rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white/90 backdrop-blur-[20px] border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-h-[44px] ${
                          !notification.isRead
                            ? 'border-[#7C9AA5]/30 shadow-[0_2px_8px_rgba(124,154,165,0.1)]'
                            : 'border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
                        }`}
                        onClick={() => handleMarkAsRead(notification._id)}
                      >
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            {/* Icon */}
                            <div
                              className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${color}`}
                            >
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span
                                      className={`text-[10px] sm:text-xs font-medium rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-0.5 ${badgeColor}`}
                                    >
                                      {typeLabels[notification.type] || 'General'}
                                    </span>
                                    {!notification.isRead && (
                                      <div className="h-2 w-2 rounded-full bg-[#7C9AA5] shrink-0" />
                                    )}
                                  </div>
                                  <p
                                    className={`text-xs sm:text-sm leading-relaxed ${
                                      !notification.isRead
                                        ? 'font-medium text-[#1F2937]'
                                        : 'text-[#6B7280]'
                                    }`}
                                  >
                                    {notification.message}
                                  </p>
                                </div>
                                <span className="text-[10px] sm:text-xs text-[#6B7280] shrink-0 whitespace-nowrap">
                                  {formatTime(notification.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
