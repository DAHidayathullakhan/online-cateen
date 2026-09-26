const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      enum: [
        'Student',
        "Master's Student",
        'Canteen Operator',
        'Kitchen Staff',
        'Delivery Staff',
        'Branch Manager',
        'Admin'
      ],
      default: 'Student',
      required: true,
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
