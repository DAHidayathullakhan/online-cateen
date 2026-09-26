const {
  ProgramType,
  Course,
  Department,
  AcademicYear,
  Semester,
  Section
} = require('../models/Academic');
const { logAudit } = require('../utils/auditLogger');

exports.getAcademicHierarchy = async (req, res, next) => {
  try {
    const programTypes = await ProgramType.find({ isActive: true });
    const courses = await Course.find({ isActive: true });
    const departments = await Department.find({ isActive: true });
    const years = await AcademicYear.find({ isActive: true });
    const semesters = await Semester.find({ isActive: true });
    const sections = await Section.find({ isActive: true });

    res.json({
      success: true,
      data: {
        programTypes,
        courses,
        departments,
        years,
        semesters,
        sections
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createProgramType = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    const pt = await ProgramType.create({ name, code });
    await logAudit({ user: req.user, action: 'CREATE_PROGRAM_TYPE', target: 'ProgramType', targetId: pt._id, req });
    res.status(201).json({ success: true, data: pt });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const { name, code, degreeLevel, description } = req.body;
    const course = await Course.create({ name, code, degreeLevel, description });
    await logAudit({ user: req.user, action: 'CREATE_COURSE', target: 'Course', targetId: course._id, req });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, courses } = req.body;
    const dept = await Department.create({ name, code, courses });
    await logAudit({ user: req.user, action: 'CREATE_DEPARTMENT', target: 'Department', targetId: dept._id, req });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
};
