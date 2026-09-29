const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    degreeLevel: {
      type: String,
      enum: ['Degree', "Master's"],
      default: 'Degree'
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
      default: '1st Year'
    },
    semester: {
      type: String,
      default: '1st Semester'
    },
    section: {
      type: String,
      default: 'Section A'
    },
    hostelBuilding: {
      type: String,
      default: 'None'
    },
    roomNumber: {
      type: String,
      default: ''
    },
    dietaryPreferences: [{ type: String }],
    allergies: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
