const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
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
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    studentId: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      index: true
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
