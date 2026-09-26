const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(e => e.msg).join(', ');
    return res.status(400).json({ success: false, message: errorMsg });
  }
  next();
};

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn([
    'Student',
    "Master's Student",
    'Canteen Operator',
    'Kitchen Staff',
    'Delivery Staff',
    'Branch Manager',
    'Admin'
  ]),
  handleValidationErrors
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

module.exports = {
  registerValidator,
  loginValidator,
  handleValidationErrors
};
