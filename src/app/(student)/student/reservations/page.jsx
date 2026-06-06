'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Clock,
  XCircle,
  CheckCircle2,
  Users,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const statusBadgeMap = {
  active: 'bg-[#E8F0EC] text-[#6B8F83]',
  fulfilled: 'bg-[#DDE7EA] text-[#5D7480]',
  expired: 'bg-[#FEF3E2] text-[#C4952A]',
  cancelled: 'bg-[#F9FAFB] text-[#6B7280]',
};

const statusIcons = {
  active: Clock,
  fulfilled: CheckCircle2,
  expired: AlertCircle,
  cancelled: XCircle,
};

const statusIconColors = {
  active: 'bg-[#E8F0EC] text-[#6B8F83]',
  fulfilled: 'bg-[#DDE7EA] text-[#5D7480]',
  expired: 'bg-[#FEF3E2] text-[#C4952A]',
  cancelled: 'bg-[#F9FAFB] text-[#6B7280]',
};

export default function ReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [activeReservations, setActiveReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingReservation, setCancellingReservation] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/reservations?limit=100');
      const reservations = res.data.items || [];

      const active = reservations.filter((r) => r.status === 'active');
      const past = reservations.filter(
        (r) =>
          r.status === 'fulfilled' ||
          r.status === 'expired' ||
          r.status === 'cancelled'
      );

      setActiveReservations(active);
      setPastReservations(past);
    } catch (error) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  async function handleCancel() {
    if (!cancellingReservation) return;
    setCancelling(true);
    try {
      await apiFetch(`/reservations/${cancellingReservation._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      toast.success('Reservation cancelled successfully');
      setCancelDialogOpen(false);
      setCancellingReservation(null);
      loadReservations();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return <LoadingSpinner message="Loading reservations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Reservations</h1>
        <p className="text-[#6B7280] mt-1">
          Track your book reservations and queue positions.
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white rounded-xl px-4 transition-all duration-200"
          >
            Active ({activeReservations.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-[#7C9AA5] data-[state=active]:text-white rounded-xl px-4 transition-all duration-200"
          >
            Past ({pastReservations.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Reservations */}
        <TabsContent value="active">
          {activeReservations.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No active reservations"
              description="When books are unavailable, you can reserve them and join the waiting queue."
              actionLabel="Browse Books"
              onAction={() => (window.location.href = '/student/books')}
            />
          ) : (
            <div className="space-y-3">
              {activeReservations.map((reservation) => {
                const book = reservation.bookId || {};
                const StatusIcon = statusIcons[reservation.status] || Clock;
                const iconColor = statusIconColors[reservation.status] || 'bg-[#DDE7EA] text-[#5D7480]';
                const hasExpiry =
                  reservation.expiryDate &&
                  new Date(reservation.expiryDate) > new Date();

                return (
                  <div
                    key={reservation._id}
                    className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 sm:p-6 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                          <StatusIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/student/books/${book._id}`}
                            className="font-semibold hover:text-[#5D7480] transition-colors text-[#1F2937]"
                          >
                            {book.title || 'Unknown Book'}
                          </Link>
                          <p className="text-sm text-[#6B7280]">
                            {book.author || 'Unknown Author'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {/* Queue Position */}
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-[#5D7480]" />
                              <span className="text-sm font-medium text-[#5D7480]">
                                Queue Position: #{reservation.queuePosition}
                              </span>
                            </div>

                            {/* Reserved Date */}
                            <span className="text-xs text-[#6B7280] flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Reserved: {formatDate(reservation.reservedDate)}
                            </span>

                            {/* Expiry Date (if notified) */}
                            {hasExpiry && (
                              <span className="text-xs text-[#C4952A] font-medium flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Expires: {formatDateTime(reservation.expiryDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-medium rounded-xl px-2.5 py-0.5 ${
                            statusBadgeMap[reservation.status] || 'bg-[#F9FAFB] text-[#6B7280]'
                          }`}
                        >
                          {reservation.status}
                        </span>
                        <Button
                          size="sm"
                          className="bg-[#F28B82] hover:bg-[#C25B4F] text-white rounded-xl transition-all duration-200"
                          onClick={() => {
                            setCancellingReservation(reservation);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Past Reservations */}
        <TabsContent value="past">
          {pastReservations.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No past reservations"
              description="Your fulfilled, expired, or cancelled reservations will appear here."
            />
          ) : (
            <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]/80">
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Book
                      </th>
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Queue Position
                      </th>
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Reserved Date
                      </th>
                      <th className="text-left text-sm font-medium text-[#6B7280] p-4">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastReservations.map((reservation) => {
                      const book = reservation.bookId || {};
                      return (
                        <tr key={reservation._id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]/50 transition-colors">
                          <td className="p-4">
                            <Link
                              href={`/student/books/${book._id}`}
                              className="font-medium hover:text-[#5D7480] transition-colors text-[#1F2937]"
                            >
                              {book.title || 'Unknown Book'}
                            </Link>
                            <p className="text-xs text-[#6B7280]">
                              {book.author || 'Unknown Author'}
                            </p>
                          </td>
                          <td className="p-4 text-sm text-[#6B7280]">
                            #{reservation.queuePosition}
                          </td>
                          <td className="p-4 text-sm text-[#6B7280]">
                            {formatDate(reservation.reservedDate)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-xs font-medium rounded-xl px-2.5 py-0.5 ${
                                statusBadgeMap[reservation.status] || 'bg-[#F9FAFB] text-[#6B7280]'
                              }`}
                            >
                              {reservation.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#E5E7EB]">
                {pastReservations.map((reservation) => {
                  const book = reservation.bookId || {};

                  return (
                    <div key={reservation._id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/student/books/${book._id}`}
                            className="font-medium hover:text-[#5D7480] text-[#1F2937]"
                          >
                            {book.title || 'Unknown Book'}
                          </Link>
                          <p className="text-xs text-[#6B7280]">
                            {book.author || 'Unknown Author'}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium rounded-xl px-2.5 py-0.5 ${
                            statusBadgeMap[reservation.status] || 'bg-[#F9FAFB] text-[#6B7280]'
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                        <span>Queue: #{reservation.queuePosition}</span>
                        <span>Reserved: {formatDate(reservation.reservedDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#1F2937]">Cancel Reservation</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Are you sure you want to cancel your reservation for &quot;
              {cancellingReservation?.bookId?.title || 'this book'}&quot;? You
              will lose your position in the queue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-2xl border-[#E5E7EB] text-[#6B7280]">
                Keep Reservation
              </Button>
            </DialogClose>
            <Button
              className="bg-[#F28B82] hover:bg-[#C25B4F] text-white rounded-2xl transition-all duration-200"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
