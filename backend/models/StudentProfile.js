const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    degreeLevel: {
      type: String,
      enum: ['Degree', "Master's"],
      required: true
    },
    programType: {
      type: String,
      required: true
    },
    course: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    year: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    section: {
      type: String,
      default: 'A'
    },
    hostelBuilding: {
      type: String,
      required: true
    },
    roomNumber: {
      type: String,
      required: true
    },
    dietaryPreferences: [{ type: String }], // e.g., ["Vegetarian", "Jain", "No Onion", "No Garlic"]
    allergies: [{ type: String }] // e.g., ["Peanuts", "Dairy", "Gluten", "Soy"]
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
