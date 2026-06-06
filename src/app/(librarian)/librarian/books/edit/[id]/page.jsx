'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    ISBN: '',
    category: '',
    description: '',
    publisher: '',
    publishedYear: '',
    language: 'English',
    pages: '',
    totalCopies: '1',
    availableCopies: '1',
    shelfLocation: '',
    coverImage: '',
    tags: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (bookId) {
      fetchBook();
      fetchCategories();
    }
  }, [bookId]);

  async function fetchBook() {
    try {
      setLoading(true);
      const res = await apiFetch(`/books/${bookId}`);
      const book = res.data;
      setForm({
        title: book.title || '',
        author: book.author || '',
        ISBN: book.ISBN || '',
        category: book.category?._id || book.category || '',
        description: book.description || '',
        publisher: book.publisher || '',
        publishedYear: book.publishedYear?.toString() || '',
        language: book.language || 'English',
        pages: book.pages?.toString() || '',
        totalCopies: book.totalCopies?.toString() || '1',
        availableCopies: book.availableCopies?.toString() || '1',
        shelfLocation: book.shelfLocation || '',
        coverImage: book.coverImage || '',
        tags: Array.isArray(book.tags) ? book.tags.join(', ') : '',
      });
    } catch (error) {
      toast.error('Failed to load book details');
      router.push('/librarian/books');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await apiFetch('/books/categories');
      setCategories(res.data || []);
    } catch (error) {
      // Silently fail
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.author.trim()) newErrors.author = 'Author is required';
    if (!form.ISBN.trim()) newErrors.ISBN = 'ISBN is required';
    if (!form.totalCopies || parseInt(form.totalCopies) < 1)
      newErrors.totalCopies = 'At least 1 copy is required';
    if (
      form.availableCopies &&
      parseInt(form.availableCopies) > parseInt(form.totalCopies || 0)
    )
      newErrors.availableCopies = 'Cannot exceed total copies';
    if (
      form.publishedYear &&
      (parseInt(form.publishedYear) < 1000 ||
        parseInt(form.publishedYear) > new Date().getFullYear())
    )
      newErrors.publishedYear = 'Invalid year';
    if (form.pages && parseInt(form.pages) < 0)
      newErrors.pages = 'Pages cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        ISBN: form.ISBN.trim(),
        category: form.category || null,
        description: form.description.trim(),
        publisher: form.publisher.trim(),
        publishedYear: form.publishedYear ? parseInt(form.publishedYear) : null,
        language: form.language || 'English',
        pages: form.pages ? parseInt(form.pages) : 0,
        totalCopies: parseInt(form.totalCopies),
        availableCopies: parseInt(form.availableCopies),
        shelfLocation: form.shelfLocation.trim(),
        coverImage: form.coverImage.trim(),
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      await apiFetch(`/books/${bookId}`, {
        method: 'PUT',
        body: payload,
      });

      toast.success('Book updated successfully!');
      router.push('/librarian/books');
    } catch (error) {
      toast.error(error.message || 'Failed to update book');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading book details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/librarian/books')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Book</h1>
          <p className="text-muted-foreground">
            Update the book information below.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter book title"
                      value={form.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className={errors.title ? 'border-rose-300' : ''}
                    />
                    {errors.title && (
                      <p className="text-xs text-rose-500">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">
                      Author <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="author"
                      placeholder="Enter author name"
                      value={form.author}
                      onChange={(e) => handleChange('author', e.target.value)}
                      className={errors.author ? 'border-rose-300' : ''}
                    />
                    {errors.author && (
                      <p className="text-xs text-rose-500">{errors.author}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ISBN">
                      ISBN <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="ISBN"
                      placeholder="e.g., 978-3-16-148410-0"
                      value={form.ISBN}
                      onChange={(e) => handleChange('ISBN', e.target.value)}
                      className={errors.ISBN ? 'border-rose-300' : ''}
                    />
                    {errors.ISBN && (
                      <p className="text-xs text-rose-500">{errors.ISBN}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(val) => handleChange('category', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter book description..."
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., fiction, adventure, classic"
                    value={form.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Publication Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publication Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      placeholder="Enter publisher name"
                      value={form.publisher}
                      onChange={(e) => handleChange('publisher', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publishedYear">Published Year</Label>
                    <Input
                      id="publishedYear"
                      type="number"
                      placeholder="e.g., 2024"
                      value={form.publishedYear}
                      onChange={(e) =>
                        handleChange('publishedYear', e.target.value)
                      }
                      className={errors.publishedYear ? 'border-rose-300' : ''}
                    />
                    {errors.publishedYear && (
                      <p className="text-xs text-rose-500">
                        {errors.publishedYear}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={form.language}
                      onValueChange={(val) => handleChange('language', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="Arabic">Arabic</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pages">Number of Pages</Label>
                    <Input
                      id="pages"
                      type="number"
                      placeholder="e.g., 350"
                      value={form.pages}
                      onChange={(e) => handleChange('pages', e.target.value)}
                      className={errors.pages ? 'border-rose-300' : ''}
                    />
                    {errors.pages && (
                      <p className="text-xs text-rose-500">{errors.pages}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Inventory & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCopies">
                    Total Copies <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="totalCopies"
                    type="number"
                    min="1"
                    value={form.totalCopies}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('totalCopies', val);
                      if (parseInt(val) < parseInt(form.availableCopies)) {
                        handleChange('availableCopies', val);
                      }
                    }}
                    className={errors.totalCopies ? 'border-rose-300' : ''}
                  />
                  {errors.totalCopies && (
                    <p className="text-xs text-rose-500">{errors.totalCopies}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availableCopies">Available Copies</Label>
                  <Input
                    id="availableCopies"
                    type="number"
                    min="0"
                    value={form.availableCopies}
                    onChange={(e) =>
                      handleChange('availableCopies', e.target.value)
                    }
                    className={errors.availableCopies ? 'border-rose-300' : ''}
                  />
                  {errors.availableCopies && (
                    <p className="text-xs text-rose-500">
                      {errors.availableCopies}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelfLocation">Shelf Location</Label>
                  <Input
                    id="shelfLocation"
                    placeholder="e.g., A3-R2-S5"
                    value={form.shelfLocation}
                    onChange={(e) =>
                      handleChange('shelfLocation', e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Image URL</Label>
                  <Input
                    id="coverImage"
                    placeholder="https://example.com/cover.jpg"
                    value={form.coverImage}
                    onChange={(e) =>
                      handleChange('coverImage', e.target.value)
                    }
                  />
                </div>
                {form.coverImage && (
                  <div className="rounded-lg border overflow-hidden">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {submitting ? 'Updating Book...' : 'Update Book'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push('/librarian/books')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
