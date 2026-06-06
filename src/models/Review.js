import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    default: '',
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
