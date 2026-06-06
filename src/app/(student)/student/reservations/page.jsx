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
import { Card, CardContent } from '@/components/ui/card';
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

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    fulfilled: 'bg-teal-100 text-teal-700',
    expired: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  const statusIcons = {
    active: Clock,
    fulfilled: CheckCircle2,
    expired: AlertCircle,
    cancelled: XCircle,
  };

  if (loading) {
    return <LoadingSpinner message="Loading reservations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
        <p className="text-muted-foreground">
          Track your book reservations and queue positions.
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            Active ({activeReservations.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
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
                const hasExpiry =
                  reservation.expiryDate &&
                  new Date(reservation.expiryDate) > new Date();

                return (
                  <Card key={reservation._id} className="border-emerald-100">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <StatusIcon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/student/books/${book._id}`}
                              className="font-semibold hover:text-emerald-600 transition-colors"
                            >
                              {book.title || 'Unknown Book'}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {book.author || 'Unknown Author'}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {/* Queue Position */}
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-700">
                                  Queue Position: #{reservation.queuePosition}
                                </span>
                              </div>

                              {/* Reserved Date */}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Reserved: {formatDate(reservation.reservedDate)}
                              </span>

                              {/* Expiry Date (if notified) */}
                              {hasExpiry && (
                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Expires: {formatDateTime(reservation.expiryDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            className={`text-xs ${
                              statusColors[reservation.status] || 'bg-gray-100 text-gray-700'
                            }`}
                            variant="secondary"
                          >
                            {reservation.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
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
                    </CardContent>
                  </Card>
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
            <Card>
              <CardContent className="p-0">
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Book
                        </th>
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Queue Position
                        </th>
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Reserved Date
                        </th>
                        <th className="text-left text-sm font-medium text-muted-foreground p-4">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastReservations.map((reservation) => {
                        const book = reservation.bookId || {};
                        return (
                          <tr
                            key={reservation._id}
                            className="border-b last:border-0 hover:bg-muted/30"
                          >
                            <td className="p-4">
                              <Link
                                href={`/student/books/${book._id}`}
                                className="font-medium hover:text-emerald-600 transition-colors"
                              >
                                {book.title || 'Unknown Book'}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {book.author || 'Unknown Author'}
                              </p>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              #{reservation.queuePosition}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {formatDate(reservation.reservedDate)}
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`text-xs ${
                                  statusColors[reservation.status] || 'bg-gray-100 text-gray-700'
                                }`}
                                variant="secondary"
                              >
                                {reservation.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y">
                  {pastReservations.map((reservation) => {
                    const book = reservation.bookId || {};
                    const StatusIcon = statusIcons[reservation.status] || Clock;

                    return (
                      <div key={reservation._id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/student/books/${book._id}`}
                              className="font-medium hover:text-emerald-600"
                            >
                              {book.title || 'Unknown Book'}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {book.author || 'Unknown Author'}
                            </p>
                          </div>
                          <Badge
                            className={`text-xs ${
                              statusColors[reservation.status] || 'bg-gray-100 text-gray-700'
                            }`}
                            variant="secondary"
                          >
                            {reservation.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Queue: #{reservation.queuePosition}</span>
                          <span>Reserved: {formatDate(reservation.reservedDate)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your reservation for &quot;
              {cancellingReservation?.bookId?.title || 'this book'}&quot;? You
              will lose your position in the queue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Keep Reservation</Button>
            </DialogClose>
            <Button
              variant="destructive"
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
