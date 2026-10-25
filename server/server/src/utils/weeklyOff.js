// Weekly off din (0 = Sunday ... 6 = Saturday). .env me WEEKLY_OFF_DAYS=0,6 jaisa likh sakte ho.
const WEEKLY_OFF = String(process.env.WEEKLY_OFF_DAYS === undefined ? '0' : process.env.WEEKLY_OFF_DAYS)
  .split(',').map((x) => x.trim()).filter(Boolean).map(Number);

module.exports = { WEEKLY_OFF };
