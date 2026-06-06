'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowLeft,
  Save,
  Plus,
  BookCheck,
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
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';
import { toast } from 'sonner';

export default function AddBookPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
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
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoadingCategories(true);
      const res = await apiFetch('/books/categories');
      setCategories(res.data || []);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
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
    if (form.publishedYear && (parseInt(form.publishedYear) < 1000 || parseInt(form.publishedYear) > new Date().getFullYear()))
      newErrors.publishedYear = 'Invalid year';
    if (form.pages && parseInt(form.pages) < 0)
      newErrors.pages = 'Pages cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e, addAnother = false) {
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

      await apiFetch('/books', {
        method: 'POST',
        body: payload,
      });

      toast.success('Book added successfully!');

      if (addAnother) {
        setForm({
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
        setErrors({});
      } else {
        router.push('/librarian/books');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCategories) {
    return <LoadingSpinner message="Loading form..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/librarian/books')}
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#7C9AA5]/10 transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[42px] font-bold tracking-tight text-[#1F2937]">Add New Book</h1>
          <p className="text-[#6B7280] mt-1">
            Fill in the details to add a new book to the library.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information - Glass Card */}
            <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#7C9AA5]" />
                  Basic Information
                </h2>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-[#1F2937]">
                      Title <span className="text-[#F28B82]">*</span>
                    </Label>
                    <input
                      id="title"
                      placeholder="Enter book title"
                      value={form.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className={`w-full rounded-xl h-12 bg-[#F9FAFB] border ${errors.title ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`}
                    />
                    {errors.title && (
                      <p className="text-xs text-[#C25B4F]">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author" className="text-sm font-medium text-[#1F2937]">
                      Author <span className="text-[#F28B82]">*</span>
                    </Label>
                    <input
                      id="author"
                      placeholder="Enter author name"
                      value={form.author}
                      onChange={(e) => handleChange('author', e.target.value)}
                      className={`w-full rounded-xl h-12 bg-[#F9FAFB] border ${errors.author ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`}
                    />
                    {errors.author && (
                      <p className="text-xs text-[#C25B4F]">{errors.author}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ISBN" className="text-sm font-medium text-[#1F2937]">
                      ISBN <span className="text-[#F28B82]">*</span>
                    </Label>
                    <input
                      id="ISBN"
                      placeholder="e.g., 978-3-16-148410-0"
                      value={form.ISBN}
                      onChange={(e) => handleChange('ISBN', e.target.value)}
                      className={`w-full rounded-xl h-12 bg-[#F9FAFB] border ${errors.ISBN ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`}
                    />
                    {errors.ISBN && (
                      <p className="text-xs text-[#C25B4F]">{errors.ISBN}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium text-[#1F2937]">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(val) => handleChange('category', val)}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1F2937]">
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
                  <Label htmlFor="description" className="text-sm font-medium text-[#1F2937]">Description</Label>
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
                  <Label htmlFor="tags" className="text-sm font-medium text-[#1F2937]">Tags (comma-separated)</Label>
                  <input
                    id="tags"
                    placeholder="e.g., fiction, adventure, classic"
                    value={form.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    className="w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Publication Details - Glass Card */}
            <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-[#1F2937]">Publication Details</h2>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="publisher" className="text-sm font-medium text-[#1F2937]">Publisher</Label>
                    <input
                      id="publisher"
                      placeholder="Enter publisher name"
                      value={form.publisher}
                      onChange={(e) => handleChange('publisher', e.target.value)}
                      className="w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publishedYear" className="text-sm font-medium text-[#1F2937]">Published Year</Label>
                    <input
                      id="publishedYear"
                      type="number"
                      placeholder="e.g., 2024"
                      value={form.publishedYear}
                      onChange={(e) => handleChange('publishedYear', e.target.value)}
                      className={`w-full rounded-xl h-12 bg-[#F9FAFB] border ${errors.publishedYear ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`}
                    />
                    {errors.publishedYear && (
                      <p className="text-xs text-[#C25B4F]">{errors.publishedYear}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium text-[#1F2937]">Language</Label>
                    <Select
                      value={form.language}
                      onValueChange={(val) => handleChange('language', val)}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] text-[#1F2937]">
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
                    <Label htmlFor="pages" className="text-sm font-medium text-[#1F2937]">Number of Pages</Label>
                    <input
                      id="pages"
                      type="number"
                      placeholder="e.g., 350"
                      value={form.pages}
                      onChange={(e) => handleChange('pages', e.target.value)}
                      className={`w-full rounded-xl h-12 bg-[#F9FAFB] border ${errors.pages ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`}
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
          <div className="space-y-6">
            {/* Inventory & Location - Glass Card */}
            <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-[#1F2937]">Inventory & Location</h2>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalCopies" className="text-sm font-medium text-[#1F2937]">
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
                    className={`w-full rounded-xl h-12 bg-[#F9FAFB] border ${errors.totalCopies ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`}
                  />
                  {errors.totalCopies && (
                    <p className="text-xs text-[#C25B4F]">{errors.totalCopies}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availableCopies" className="text-sm font-medium text-[#1F2937]">Available Copies</Label>
                  <input
                    id="availableCopies"
                    type="number"
                    min="0"
                    value={form.availableCopies}
                    onChange={(e) => handleChange('availableCopies', e.target.value)}
                    className={`w-full rounded-xl h-12 bg-[#F9FAFB] border ${errors.availableCopies ? 'border-[#F28B82]' : 'border-[#E5E7EB]'} px-4 text-sm text-[#1F2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors`}
                  />
                  {errors.availableCopies && (
                    <p className="text-xs text-[#C25B4F]">{errors.availableCopies}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shelfLocation" className="text-sm font-medium text-[#1F2937]">Shelf Location</Label>
                  <input
                    id="shelfLocation"
                    placeholder="e.g., A3-R2-S5"
                    value={form.shelfLocation}
                    onChange={(e) => handleChange('shelfLocation', e.target.value)}
                    className="w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Cover Image - Glass Card */}
            <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <div className="p-6 pb-4">
                <h2 className="text-lg font-semibold text-[#1F2937]">Cover Image</h2>
              </div>
              <div className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage" className="text-sm font-medium text-[#1F2937]">Image URL</Label>
                  <input
                    id="coverImage"
                    placeholder="https://example.com/cover.jpg"
                    value={form.coverImage}
                    onChange={(e) => handleChange('coverImage', e.target.value)}
                    className="w-full rounded-xl h-12 bg-[#F9FAFB] border border-[#E5E7EB] px-4 text-sm text-[#1F2937] placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7480] transition-colors"
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
            <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 space-y-3">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-medium bg-[#7C9AA5] hover:bg-[#5D7480] text-white transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480] disabled:opacity-50"
                disabled={submitting}
              >
                <Save className="h-4 w-4" />
                {submitting ? 'Adding Book...' : 'Add Book'}
              </button>
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-medium border-2 border-[#7C9AA5] text-[#7C9AA5] hover:bg-[#7C9AA5]/10 transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#5D7480] disabled:opacity-50"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, true)}
              >
                <Plus className="h-4 w-4" />
                Add Another
              </button>
              <Separator className="bg-[#E5E7EB]" />
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-2xl text-sm font-medium text-[#6B7280] hover:text-[#1F2937] hover:bg-[#7C9AA5]/10 transition-all duration-200"
                onClick={() => router.push('/librarian/books')}
              >
                <BookCheck className="h-4 w-4" />
                Go to Books List
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
