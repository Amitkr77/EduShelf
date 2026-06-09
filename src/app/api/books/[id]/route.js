import { connectDB } from '@/lib/db.js';
import Book from '@/models/Book.js';
import Category from '@/models/Category.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/books/[id] — Get single book with populated category
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const book = await Book.findById(id).populate('category', 'name description icon');

    if (!book) {
      return apiError('Book not found', 404);
    }

    return apiResponse(book, 'Book retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/books/[id] — Update book (librarian/admin only)
export async function PUT(request, { params }) {
  return withRole(request, ['librarian', 'admin'], async (user) => {
    try {
      await connectDB();

      const { id } = await params;
      const body = await request.json();

      // Check if book exists
      const existingBook = await Book.findById(id);
      if (!existingBook) {
        return apiError('Book not found', 404);
      }

      // If ISBN is being updated, check uniqueness
      if (body.ISBN && body.ISBN.trim() !== existingBook.ISBN) {
        const isbnExists = await Book.findOne({
          ISBN: body.ISBN.trim(),
          _id: { $ne: id },
        });
        if (isbnExists) {
          return apiError('ISBN already exists', 409);
        }
      }

      // Build update object with only provided fields
      const updateFields = {};
      const allowedFields = [
        'title', 'author', 'ISBN', 'category', 'description',
        'publisher', 'publishedYear', 'language', 'pages',
        'totalCopies', 'availableCopies', 'shelfLocation',
        'coverImage', 'tags',
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          if (typeof body[field] === 'string') {
            updateFields[field] = body[field].trim();
          } else {
            updateFields[field] = body[field];
          }
        }
      }

      const updatedBook = await Book.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).populate('category', 'name description icon');

      return apiResponse(updatedBook, 'Book updated successfully');
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// DELETE /api/books/[id] — Delete book (librarian/admin only)
export async function DELETE(request, { params }) {
  return withRole(request, ['librarian', 'admin'], async (user) => {
    try {
      await connectDB();

      const { id } = await params;

      const book = await Book.findById(id);
      if (!book) {
        return apiError('Book not found', 404);
      }

      await Book.findByIdAndDelete(id);

      return apiResponse(null, 'Book deleted successfully');
    } catch (error) {
      return handleApiError(error);
    }
  });
}
