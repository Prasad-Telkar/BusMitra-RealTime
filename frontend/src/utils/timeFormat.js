export function formatTime(gtfsTime) {
  if (!gtfsTime) return gtfsTime;
  const parts = gtfsTime.split(':');
  if (parts.length < 2) return gtfsTime;
  
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  let suffix = 'AM';
  
  if (h >= 24) {
    h -= 24;
  }
  
  if (h >= 12) {
    suffix = 'PM';
    if (h > 12) h -= 12;
  } else if (h === 0) {
    h = 12;
  }
  
  return `${h}:${m} ${suffix}`;
}
