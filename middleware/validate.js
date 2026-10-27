const { body, validationResult } = require('express-validator');
const { ALLOWED_APPOINTMENT_SLOTS, isAllowedAppointmentDate } = require('../services/slots');

const bookingRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Valid 10-digit mobile required'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Valid age required'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('treatment').notEmpty().withMessage('Focus area is required'),
  body('appt_date').custom(isAllowedAppointmentDate).withMessage('Please select a valid booking date'),
  body('appt_time').isIn(ALLOWED_APPOINTMENT_SLOTS).withMessage('Please select a valid time slot'),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ error: errors.array()[0].msg });
  next();
}

module.exports = { bookingRules, validate };
