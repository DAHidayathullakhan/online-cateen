const mongoose = require('mongoose');

const programTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true }
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  degreeLevel: { type: String, enum: ['Degree', "Master's"], required: true },
  description: { type: String }
});

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  courses: [{ type: String }]
});

const academicYearSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true }
});

const semesterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true }
});

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true }
});

module.exports = {
  ProgramType: mongoose.model('ProgramType', programTypeSchema),
  Course: mongoose.model('Course', courseSchema),
  Department: mongoose.model('Department', departmentSchema),
  AcademicYear: mongoose.model('AcademicYear', academicYearSchema),
  Semester: mongoose.model('Semester', semesterSchema),
  Section: mongoose.model('Section', sectionSchema)
};
