import mongoose from 'mongoose';

const fineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrow',
    required: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  daysOverdue: {
    type: Number,
    required: true,
    default: 0,
  },
  dailyRate: {
    type: Number,
    required: true,
    default: 2,
  },
  reason: {
    type: String,
    default: 'Overdue return',
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'waived'],
    default: 'pending',
  },
  paidDate: {
    type: Date,
    default: null,
  },
  paidTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

fineSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Fine || mongoose.model('Fine', fineSchema);
