function addDurationToDate(baseDate, duration, unit) {
  const d = new Date(baseDate);

  switch (unit) {
    case 'Year':
      d.setFullYear(d.getFullYear() + duration);
      break;
    case 'Month':
      d.setMonth(d.getMonth() + duration);
      break;
    case 'Week':
      d.setDate(d.getDate() + duration * 7);
      break;
    case 'Hour':
      d.setTime(d.getTime() + duration * 60 * 60 * 1000);
      break;
    case 'Minute':
      d.setTime(d.getTime() + duration * 60 * 1000);
      break;
    default:
      d.setDate(d.getDate() + duration);
  }

  return d;
}

module.exports = { addDurationToDate };