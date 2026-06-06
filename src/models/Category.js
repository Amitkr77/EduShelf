import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
