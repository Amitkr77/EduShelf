import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'register',
      'book_add', 'book_edit', 'book_delete',
      'borrow_request', 'borrow_approve', 'borrow_reject', 'borrow_issue', 'borrow_return', 'borrow_renew',
      'reservation_create', 'reservation_cancel', 'reservation_fulfill',
      'fine_create', 'fine_pay', 'fine_waive',
      'user_suspend', 'user_activate',
      'review_add', 'review_delete',
      'wishlist_add', 'wishlist_remove',
    ],
  },
  details: {
    type: String,
    default: '',
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  resourceType: {
    type: String,
    enum: ['book', 'borrow', 'reservation', 'fine', 'user', 'review', null],
    default: null,
  },
  ipAddress: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
