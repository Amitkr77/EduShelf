import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
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
  queuePosition: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'expired', 'cancelled'],
    default: 'active',
  },
  reservedDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  fulfilledDate: {
    type: Date,
    default: null,
  },
  notifiedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

reservationSchema.index({ bookId: 1, status: 1, queuePosition: 1 });

export default mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
