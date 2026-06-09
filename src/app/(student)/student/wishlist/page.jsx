'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart,
  BookOpen,
  Star,
  Trash2,
  ShoppingBag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const COVER_GRADIENTS = [
  'from-[#7C9AA5]/30 to-[#5D7480]/30',
  'from-[#7CCB7A]/30 to-[#6B8F83]/30',
  'from-[#F3C47A]/30 to-[#C4952A]/30',
  'from-[#84C7E8]/30 to-[#4A8DB7]/30',
  'from-[#A7C2B0]/30 to-[#6B8F83]/30',
];

function getCoverGradient(index) {
  return COVER_GRADIENTS[index % COVER_GRADIENTS.length];
}

export default function WishlistPage() {
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [removing, setRemoving] = useState(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/wishlist?limit=100');
      setWishlistItems(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  async function handleRemove(wishlistItemId, bookTitle) {
    setRemoving(wishlistItemId);
    try {
      await apiFetch(`/wishlist/${wishlistItemId}`, { method: 'DELETE' });
      toast.success(`Removed "${bookTitle}" from wishlist`);
      setWishlistItems((prev) =>
        prev.filter((item) => item._id !== wishlistItemId)
      );
    } catch (error) {
      toast.error(error.message || 'Failed to remove from wishlist');
    } finally {
      setRemoving(null);
    }
  }

  async function handleBorrow(bookId) {
    try {
      await apiFetch('/borrow', {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      });
      toast.success('Borrow request submitted! Waiting for approval.');
    } catch (error) {
      toast.error(error.message || 'Failed to request borrow');
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading your wishlist..." />;
  }

  return (
    <div className="page-enter space-y-4 sm:space-y-6">
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">My Wishlist</h1>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1">
            Books you want to read in the future.
          </p>
        </div>
        {wishlistItems.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-xl sm:rounded-2xl px-3 py-1.5 text-sm font-medium bg-[#FDE8E6]/60 text-[#C25B4F] shrink-0">
            <Heart className="h-3.5 w-3.5 fill-[#F28B82]" />
            {wishlistItems.length} book{wishlistItems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div> */}

      {wishlistItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save books you're interested in to your wishlist so you can easily find them later."
          actionLabel="Browse Books"
          onAction={() => (window.location.href = '/student/books')}
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {wishlistItems.map((item, index) => {
            const book = item.bookId || {};
            const isAvailable = book.availableCopies > 0;

            return (
              <div
                key={item._id}
                className="group rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-[#7C9AA5]/40 flex flex-col"
              >
                {/* Cover */}
                <Link href={`/student/books/${book._id || '#'}`}>
                  <div
                    className={`aspect-[4/3] bg-gradient-to-br ${getCoverGradient(
                      index
                    )} flex items-center justify-center relative overflow-hidden`}
                  >
                    {book.coverImage ? (
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-8 sm:h-12 w-8 sm:w-12 text-[#7C9AA5]/40" />
                    )}

                    {/* Availability badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      {isAvailable ? (
                        <span className="inline-block rounded-lg sm:rounded-xl px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-[#E8F0EC] text-[#6B8F83]">
                          Available
                        </span>
                      ) : (
                        <span className="inline-block rounded-lg sm:rounded-xl px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-[#FDE8E6] text-[#C25B4F]">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col">
                  <Link href={`/student/books/${book._id || '#'}`}>
                    <h3 className="font-semibold text-xs sm:text-sm truncate group-hover:text-[#5D7480] transition-colors text-[#1F2937]">
                      {book.title || 'Unknown Book'}
                    </h3>
                  </Link>
                  <p className="text-[10px] sm:text-xs text-[#6B7280] mt-0.5 truncate">
                    {book.author || 'Unknown Author'}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-[#F3C47A] text-[#F3C47A]" />
                    <span className="text-[10px] sm:text-xs text-[#6B7280]">
                      {book.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                    {isAvailable && (
                      <Button
                        size="sm"
                        className="flex-1 bg-[#7C9AA5] hover:bg-[#5D7480] text-white text-[10px] sm:text-xs rounded-lg sm:rounded-xl h-8 sm:h-9 transition-all duration-200 hover:-translate-y-0.5"
                        onClick={() => handleBorrow(book._id)}
                      >
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        Borrow
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#C25B4F] border-[#F28B82]/30 hover:bg-[#FDE8E6]/30 hover:text-[#C25B4F] text-[10px] sm:text-xs rounded-lg sm:rounded-xl h-8 sm:h-9 transition-all duration-200 hover:-translate-y-0.5 min-w-0"
                      onClick={() => handleRemove(item._id, book.title)}
                      disabled={removing === item._id}
                    >
                      <Trash2 className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">{removing === item._id ? 'Removing...' : 'Remove'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
