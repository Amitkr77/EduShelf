import { connectDB } from '@/lib/db.js';
import Category from '@/models/Category.js';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers.js';
import { withRole } from '@/lib/middleware.js';

// GET /api/books/categories — List all categories
export async function GET(request) {
  try {
    await connectDB();

    const categories = await Category.find().sort({ name: 1 });

    return apiResponse(categories, 'Categories retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/books/categories — Create category (librarian/admin only)
export async function POST(request) {
  return withRole(request, ['librarian', 'admin'], async (user) => {
    try {
      await connectDB();

      const body = await request.json();
      const { name, description, icon } = body;

      // Validate required field
      if (!name || !name.trim()) {
        return apiError('Category name is required');
      }

      // Check unique name
      const existingCategory = await Category.findOne({ name: name.trim() });
      if (existingCategory) {
        return apiError('Category name already exists', 409);
      }

      const category = await Category.create({
        name: name.trim(),
        description: description || '',
        icon: icon || '',
      });

      return apiResponse(category, 'Category created successfully', true, 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
