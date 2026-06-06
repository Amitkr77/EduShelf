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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

const COVER_COLORS = [
  'from-emerald-200 to-teal-300',
  'from-teal-200 to-cyan-300',
  'from-amber-200 to-orange-300',
  'from-rose-200 to-pink-300',
  'from-violet-200 to-purple-300',
  'from-sky-200 to-blue-300',
];

function getCoverColor(index) {
  return COVER_COLORS[index % COVER_COLORS.length];
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

  if (loading) {
    return <LoadingSpinner message="Loading your wishlist..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground">
            Books you want to read in the future.
          </p>
        </div>
        {wishlistItems.length > 0 && (
          <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100">
            <Heart className="h-3 w-3 mr-1 fill-rose-500" />
            {wishlistItems.length} book{wishlistItems.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save books you're interested in to your wishlist so you can easily find them later."
          actionLabel="Browse Books"
          onAction={() => (window.location.href = '/student/books')}
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistItems.map((item, index) => {
            const book = item.bookId || {};
            const isAvailable = book.availableCopies > 0;

            return (
              <Card
                key={item._id}
                className="group overflow-hidden transition-all hover:shadow-lg hover:border-emerald-200"
              >
                {/* Cover */}
                <Link href={`/student/books/${book._id || '#'}`}>
                  <div
                    className={`aspect-[4/3] bg-gradient-to-br ${getCoverColor(
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
                      <BookOpen className="h-12 w-12 text-white/60" />
                    )}

                    {/* Availability badge */}
                    <div className="absolute top-2 right-2">
                      {isAvailable ? (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 text-xs">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>

                <CardContent className="p-4">
                  <Link href={`/student/books/${book._id || '#'}`}>
                    <h3 className="font-semibold text-sm truncate group-hover:text-emerald-600 transition-colors">
                      {book.title || 'Unknown Book'}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {book.author || 'Unknown Author'}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-muted-foreground">
                      {book.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {isAvailable && (
                      <Link href={`/student/books/${book._id}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Borrow
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs"
                      onClick={() => handleRemove(item._id, book.title)}
                      disabled={removing === item._id}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {removing === item._id ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
