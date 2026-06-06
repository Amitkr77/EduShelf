import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 500,
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: 200,
  },
  ISBN: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000,
  },
  publisher: {
    type: String,
    default: '',
  },
  publishedYear: {
    type: Number,
    default: null,
  },
  language: {
    type: String,
    default: 'English',
  },
  pages: {
    type: Number,
    default: 0,
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1,
    min: [0, 'Total copies cannot be negative'],
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1,
    min: [0, 'Available copies cannot be negative'],
  },
  shelfLocation: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  borrowCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

bookSchema.index({ title: 'text', author: 'text', ISBN: 'text' });

export default mongoose.models.Book || mongoose.model('Book', bookSchema);
