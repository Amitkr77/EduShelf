import { connectDB } from '@/lib/db.js';
import User from '@/models/User';
import Category from '@/models/Category';
import Book from '@/models/Book';
import { apiResponse, apiError, handleApiError } from '@/lib/helpers';

const sampleCategories = [
  { name: 'Computer Science', description: 'Programming, algorithms, and software engineering', icon: '💻' },
  { name: 'Mathematics', description: 'Pure and applied mathematics', icon: '📐' },
  { name: 'Physics', description: 'Classical and modern physics', icon: '⚛️' },
  { name: 'Literature', description: 'Classic and contemporary literature', icon: '📚' },
  { name: 'History', description: 'World history and civilizations', icon: '🏛️' },
  { name: 'Chemistry', description: 'Organic, inorganic, and physical chemistry', icon: '🧪' },
];

const sampleBooks = [
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    ISBN: '978-0262033848',
    description: 'A comprehensive textbook covering a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers.',
    publisher: 'MIT Press',
    publishedYear: 2009,
    language: 'English',
    pages: 1312,
    totalCopies: 5,
    availableCopies: 5,
    shelfLocation: 'CS-A1',
    tags: ['algorithms', 'computer science', 'textbook'],
  },
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    ISBN: '978-0132350884',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
    publisher: 'Prentice Hall',
    publishedYear: 2008,
    language: 'English',
    pages: 464,
    totalCopies: 3,
    availableCopies: 3,
    shelfLocation: 'CS-A2',
    tags: ['software engineering', 'best practices', 'clean code'],
  },
  {
    title: 'Calculus: Early Transcendentals',
    author: 'James Stewart',
    ISBN: '978-1285741550',
    description: 'Success in your calculus course starts here! James Stewart\'s Calculus texts are world-wide best-sellers for a reason.',
    publisher: 'Cengage Learning',
    publishedYear: 2015,
    language: 'English',
    pages: 1368,
    totalCopies: 4,
    availableCopies: 4,
    shelfLocation: 'MATH-B1',
    tags: ['calculus', 'mathematics', 'textbook'],
  },
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    ISBN: '978-0553380163',
    description: 'A landmark volume in science writing by one of the great minds of our time, Stephen Hawking explores the cosmos.',
    publisher: 'Bantam',
    publishedYear: 1998,
    language: 'English',
    pages: 256,
    totalCopies: 6,
    availableCopies: 6,
    shelfLocation: 'PHYS-C1',
    tags: ['physics', 'cosmology', 'science'],
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    ISBN: '978-0743273565',
    description: 'The Great Gatsby, F. Scott Fitzgerald\'s third book, stands as the supreme achievement of his career.',
    publisher: 'Scribner',
    publishedYear: 2004,
    language: 'English',
    pages: 180,
    totalCopies: 8,
    availableCopies: 8,
    shelfLocation: 'LIT-D1',
    tags: ['fiction', 'classic', 'american literature'],
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    ISBN: '978-0062316097',
    description: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution.',
    publisher: 'Harper',
    publishedYear: 2015,
    language: 'English',
    pages: 464,
    totalCopies: 5,
    availableCopies: 5,
    shelfLocation: 'HIST-E1',
    tags: ['history', 'anthropology', 'non-fiction'],
  },
  {
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    ISBN: '978-0201633610',
    description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.',
    publisher: 'Addison-Wesley',
    publishedYear: 1994,
    language: 'English',
    pages: 416,
    totalCopies: 3,
    availableCopies: 3,
    shelfLocation: 'CS-A3',
    tags: ['design patterns', 'software engineering', 'OOP'],
  },
  {
    title: 'Organic Chemistry',
    author: 'Paula Yurkanis Bruice',
    ISBN: '978-0134042282',
    description: 'A comprehensive textbook on organic chemistry, presenting the subject in a way that encourages understanding rather than memorization.',
    publisher: 'Pearson',
    publishedYear: 2016,
    language: 'English',
    pages: 1440,
    totalCopies: 4,
    availableCopies: 4,
    shelfLocation: 'CHEM-F1',
    tags: ['chemistry', 'organic chemistry', 'textbook'],
  },
  {
    title: 'Linear Algebra and Its Applications',
    author: 'David C. Lay',
    ISBN: '978-0321982384',
    description: 'With traditional linear algebra texts, the course is relatively easy for students during the early stages as material is presented in a familiar, concrete setting.',
    publisher: 'Pearson',
    publishedYear: 2014,
    language: 'English',
    pages: 576,
    totalCopies: 4,
    availableCopies: 4,
    shelfLocation: 'MATH-B2',
    tags: ['linear algebra', 'mathematics', 'textbook'],
  },
  {
    title: '1984',
    author: 'George Orwell',
    ISBN: '978-0451524935',
    description: 'Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its dystopian prospections have come to pass.',
    publisher: 'Signet Classic',
    publishedYear: 1950,
    language: 'English',
    pages: 328,
    totalCopies: 7,
    availableCopies: 7,
    shelfLocation: 'LIT-D2',
    tags: ['fiction', 'dystopian', 'classic'],
  },
];

export async function POST() {
  try {
    await connectDB();

    const results = {
      admin: null,
      librarian: null,
      categories: 0,
      books: 0,
    };

    // Create default admin user if not exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@edushelf.com',
        password: 'admin123',
        role: 'admin',
        status: 'active',
      });
      results.admin = admin;
    }

    // Create default librarian user if not exists
    const existingLibrarian = await User.findOne({ role: 'librarian' });
    if (!existingLibrarian) {
      const librarian = await User.create({
        name: 'Library Manager',
        email: 'librarian@edushelf.com',
        password: 'librarian123',
        role: 'librarian',
        status: 'active',
      });
      results.librarian = librarian;
    }

    // Create sample categories
    const existingCategoryCount = await Category.countDocuments();
    if (existingCategoryCount === 0) {
      const categories = await Category.insertMany(sampleCategories);
      results.categories = categories.length;

      // Create sample books (assign categories)
      const booksWithCategories = sampleBooks.map((book, index) => {
        const categoryIndex = index % categories.length;
        return {
          ...book,
          category: categories[categoryIndex]._id,
        };
      });
      const books = await Book.insertMany(booksWithCategories);
      results.books = books.length;
    } else {
      results.categories = existingCategoryCount;
      const existingBookCount = await Book.countDocuments();
      results.books = existingBookCount;
    }

    return apiResponse(results, 'Database seeded successfully', true, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
