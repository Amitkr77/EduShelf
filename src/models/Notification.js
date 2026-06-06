import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['due_reminder', 'overdue_alert', 'reservation_update', 'new_book', 'fine', 'borrow_approved', 'borrow_rejected', 'general'],
    default: 'general',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  relatedType: {
    type: String,
    enum: ['borrow', 'reservation', 'fine', 'book', null],
    default: null,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
