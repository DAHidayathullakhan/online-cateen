const mongoose = require('mongoose');

const programTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "Degree", "Master's"
    code: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "BCA", "BBA", "MCA"
    code: { type: String, required: true, unique: true },
    degreeLevel: { type: String, enum: ['Degree', "Master's"], required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Computer Applications"
    code: { type: String, required: true, unique: true },
    courses: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const academicYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "1st Year", "2nd Year"
    code: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "1st Semester", "3rd Semester"
    code: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Section A", "Section B"
    code: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = {
  ProgramType: mongoose.model('ProgramType', programTypeSchema),
  Course: mongoose.model('Course', courseSchema),
  Department: mongoose.model('Department', departmentSchema),
  AcademicYear: mongoose.model('AcademicYear', academicYearSchema),
  Semester: mongoose.model('Semester', semesterSchema),
  Section: mongoose.model('Section', sectionSchema)
};
