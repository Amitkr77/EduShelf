import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Delete cached model to ensure schema updates take effect during development
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'librarian', 'admin'],
    default: 'student',
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
  },
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  studentId: {
    type: String,
    default: '',
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true,
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

export default mongoose.model('User', userSchema);
