import { connectDB } from '@/lib/db.js';
import Book from '@/models/Book.js';
import {
  apiResponse,
  apiError,
  handleApiError,
  parseQueryParams,
  paginateParams,
  paginateResponse,
} from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/books — List books with search, filter, sorting, pagination
export async function GET(request) {
  try {
    await connectDB();

    const params = parseQueryParams(request);
    const { search, category, availability, publishedYear, sort } = params;
    const { page, limit, skip } = paginateParams(params);

    // Build dynamic query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { ISBN: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    }

    if (publishedYear) {
      query.publishedYear = Number(publishedYear);
    }

    // Determine sort order
    let sortOption = { createdAt: -1 }; // default: newest
    if (sort === 'title') {
      sortOption = { title: 1 };
    } else if (sort === 'popularity') {
      sortOption = { borrowCount: -1 };
    }

    const [books, total] = await Promise.all([
      Book.find(query)
        .populate('category', 'name description icon')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Book.countDocuments(query),
    ]);

    const data = paginateResponse(books, total, page, limit);

    return apiResponse(data, 'Books retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/books — Add new book (librarian/admin only)
export async function POST(request) {
  return withRole(request, ['librarian', 'admin'], async (user) => {
    try {
      await connectDB();

      const body = await request.json();
      const {
        title,
        author,
        ISBN,
        category,
        description,
        publisher,
        publishedYear,
        language,
        pages,
        totalCopies,
        availableCopies,
        shelfLocation,
        coverImage,
        tags,
      } = body;

      // Validate required fields
      if (!title || !title.trim()) {
        return apiError('Title is required');
      }
      if (!author || !author.trim()) {
        return apiError('Author is required');
      }
      if (!ISBN || !ISBN.trim()) {
        return apiError('ISBN is required');
      }

      // Check unique ISBN
      const existingBook = await Book.findOne({ ISBN: ISBN.trim() });
      if (existingBook) {
        return apiError('ISBN already exists', 409);
      }

      // Build book data
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        ISBN: ISBN.trim(),
        category: category || null,
        description: description || '',
        publisher: publisher || '',
        publishedYear: publishedYear || null,
        language: language || 'English',
        pages: pages || 0,
        totalCopies: totalCopies !== undefined ? totalCopies : 1,
        availableCopies: availableCopies !== undefined ? availableCopies : (totalCopies || 1),
        shelfLocation: shelfLocation || '',
        coverImage: coverImage || '',
        tags: tags || [],
      };

      const book = await Book.create(bookData);

      await book.populate('category', 'name description icon');

      return apiResponse(book, 'Book created successfully', true, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
