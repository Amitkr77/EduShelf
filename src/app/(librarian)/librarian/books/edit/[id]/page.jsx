'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Save,
  Loader2,
} from 'lucide-react';
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

  const inputClass = (hasError) =>
    `w-full h-11 sm:h-12 rounded-xl bg-[#F9FAFB] border ${hasError ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`;

  const labelClass = 'text-xs sm:text-sm font-medium text-[#6B7280]';

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => router.push('/librarian/books')}
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#7C9AA5]/10 transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937]">Edit Book</h1>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1">
            Update the book information below.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Basic Information - Glass Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#7C9AA5]" />
                  Basic Information
                </h2>
              </div>
              <div className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className={labelClass}>
                      Title <span className="text-[#F28B82]">*</span>
                    </Label>
                    <input
                      id="title"
                      placeholder="Enter book title"
                      value={form.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className={inputClass(errors.title)}
                    />
                    {errors.title && (
                      <p className="text-xs text-[#C25B4F]">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author" className={labelClass}>
                      Author <span className="text-[#F28B82]">*</span>
                    </Label>
                    <input
                      id="author"
                      placeholder="Enter author name"
                      value={form.author}
                      onChange={(e) => handleChange('author', e.target.value)}
                      className={inputClass(errors.author)}
                    />
                    {errors.author && (
                      <p className="text-xs text-[#C25B4F]">{errors.author}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ISBN" className={labelClass}>
                      ISBN <span className="text-[#F28B82]">*</span>
                    </Label>
                    <input
                      id="ISBN"
                      placeholder="e.g., 978-3-16-148410-0"
                      value={form.ISBN}
                      onChange={(e) => handleChange('ISBN', e.target.value)}
                      className={inputClass(errors.ISBN)}
                    />
                    {errors.ISBN && (
                      <p className="text-xs text-[#C25B4F]">{errors.ISBN}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className={labelClass}>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(val) => handleChange('category', val)}
                    >
                      <SelectTrigger className="rounded-xl h-11 sm:h-12 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1F2937]">
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
                  <Label htmlFor="description" className={labelClass}>Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter book description..."
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="rounded-xl bg-[#F9FAFB] border-[#E5E7EB] text-[#1F2937] placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#5D7480] min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className={labelClass}>Tags (comma-separated)</Label>
                  <input
                    id="tags"
                    placeholder="e.g., fiction, adventure, classic"
                    value={form.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    className={inputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* Publication Details - Glass Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">Publication Details</h2>
              </div>
              <div className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="publisher" className={labelClass}>Publisher</Label>
                    <input
                      id="publisher"
                      placeholder="Enter publisher name"
                      value={form.publisher}
                      onChange={(e) => handleChange('publisher', e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publishedYear" className={labelClass}>Published Year</Label>
                    <input
                      id="publishedYear"
                      type="number"
                      placeholder="e.g., 2024"
                      value={form.publishedYear}
                      onChange={(e) =>
                        handleChange('publishedYear', e.target.value)
                      }
                      className={inputClass(errors.publishedYear)}
                    />
                    {errors.publishedYear && (
                      <p className="text-xs text-[#C25B4F]">
                        {errors.publishedYear}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language" className={labelClass}>Language</Label>
                    <Select
                      value={form.language}
                      onValueChange={(val) => handleChange('language', val)}
                    >
                      <SelectTrigger className="rounded-xl h-11 sm:h-12 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1F2937]">
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
                    <Label htmlFor="pages" className={labelClass}>Number of Pages</Label>
                    <input
                      id="pages"
                      type="number"
                      placeholder="e.g., 350"
                      value={form.pages}
                      onChange={(e) => handleChange('pages', e.target.value)}
                      className={inputClass(errors.pages)}
                    />
                    {errors.pages && (
                      <p className="text-xs text-[#C25B4F]">{errors.pages}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Inventory & Location - Glass Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">Inventory & Location</h2>
              </div>
              <div className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCopies" className={labelClass}>
                    Total Copies <span className="text-[#F28B82]">*</span>
                  </Label>
                  <input
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
                    className={inputClass(errors.totalCopies)}
                  />
                  {errors.totalCopies && (
                    <p className="text-xs text-[#C25B4F]">{errors.totalCopies}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availableCopies" className={labelClass}>Available Copies</Label>
                  <input
                    id="availableCopies"
                    type="number"
                    min="0"
                    value={form.availableCopies}
                    onChange={(e) =>
                      handleChange('availableCopies', e.target.value)
                    }
                    className={inputClass(errors.availableCopies)}
                  />
                  {errors.availableCopies && (
                    <p className="text-xs text-[#C25B4F]">
                      {errors.availableCopies}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelfLocation" className={labelClass}>Shelf Location</Label>
                  <input
                    id="shelfLocation"
                    placeholder="e.g., A3-R2-S5"
                    value={form.shelfLocation}
                    onChange={(e) =>
                      handleChange('shelfLocation', e.target.value)
                    }
                    className={inputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* Cover Image - Glass Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-4">
                <h2 className="text-base sm:text-lg font-semibold text-[#1F2937]">Cover Image</h2>
              </div>
              <div className="p-3 sm:p-4 md:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage" className={labelClass}>Image URL</Label>
                  <input
                    id="coverImage"
                    placeholder="https://example.com/cover.jpg"
                    value={form.coverImage}
                    onChange={(e) =>
                      handleChange('coverImage', e.target.value)
                    }
                    className={inputClass(false)}
                  />
                </div>
                {form.coverImage && (
                  <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
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
              </div>
            </div>

            {/* Actions - Glass Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-3 sm:p-4 space-y-3">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 h-10 sm:h-12 rounded-xl sm:rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480] disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {submitting ? 'Updating Book...' : 'Update Book'}
              </button>
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 h-10 sm:h-12 rounded-xl sm:rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480]"
                onClick={() => router.push('/librarian/books')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
