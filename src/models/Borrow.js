import mongoose from 'mongoose';

const borrowSchema = new mongoose.Schema({
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
  issueDate: {
    type: Date,
    default: null,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  returnDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'issued', 'returned', 'overdue', 'closed', 'rejected'],
    default: 'requested',
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  renewCount: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

borrowSchema.index({ userId: 1, status: 1 });
borrowSchema.index({ bookId: 1, status: 1 });

export default mongoose.models.Borrow || mongoose.model('Borrow', borrowSchema);
