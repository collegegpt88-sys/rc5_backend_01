const ClinicSettings = require('../models/ClinicSettings');

const ALLOWED_APPOINTMENT_SLOTS = [
  '07:00 AM – 08:00 AM',
  '08:00 AM – 09:00 AM',
  '09:00 AM – 10:00 AM',
  '06:00 PM – 07:00 PM',
  '07:00 PM – 08:00 PM',
  '08:00 PM – 09:00 PM',
];
const ALLOWED_APPOINTMENT_WEEKDAYS = [0, 1, 2, 6];

function isAllowedAppointmentDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date &&
    ALLOWED_APPOINTMENT_WEEKDAYS.includes(parsed.getUTCDay());
}

// Generate 30-min slots between open/close, skip lunch
function generateSlots(openH, openM, closeH, closeM, lunchStartH, lunchStartM, lunchEndH, lunchEndM, duration) {
  const slots = [];
  let h = openH, m = openM;

  while (h < closeH || (h === closeH && m < closeM)) {
    const endM = m + duration;
    const endH = h + Math.floor(endM / 60);
    const endMin = endM % 60;

    if (endH > closeH || (endH === closeH && endMin > closeM)) break;

    // Skip lunch
    const isLunch = (h === lunchStartH && m >= lunchStartM) ||
                    (h > lunchStartH && h < lunchEndH) ||
                    (h === lunchEndH && m < lunchEndM);

    if (!isLunch) {
      const fmt = (hh, mm) => `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
      slots.push(`${fmt(h, m)} – ${fmt(endH, endMin)}`);
    }

    m += duration;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
  return slots;
}

async function getSettings() {
  let s = await ClinicSettings.findOne();
  if (!s) s = await ClinicSettings.create({});
  return s;
}

async function getAvailableSlots(date) {
  const Booking = require('../models/Booking');
  const booked = await Booking.find({
    appt_date: date,
    booking_status: { $in: ['reserved', 'confirmed', 'checked_in'] },
  }).select('appt_time');

  const bookedTimes = booked.map(b => b.appt_time);

  return ALLOWED_APPOINTMENT_SLOTS.map(slot => ({
    slot,
    available: !bookedTimes.includes(slot),
    isLunch: false,
  }));
}

module.exports = {
  ALLOWED_APPOINTMENT_SLOTS,
  isAllowedAppointmentDate,
  getAvailableSlots,
  getSettings,
  generateSlots,
};
