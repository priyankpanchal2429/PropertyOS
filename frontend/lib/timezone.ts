/**
 * Utility functions to manage dates and times consistently in the America/Los_Angeles timezone,
 * ensuring standard US formatting and correct Daylight Saving Time transitions.
 */

export function getCaliforniaDate(): Date {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
  
  return new Date(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    getPart('hour') === 24 ? 0 : getPart('hour'),
    getPart('minute'),
    getPart('second')
  );
}

export function toCaliforniaDate(date: Date | string | number): Date {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
  
  return new Date(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    getPart('hour') === 24 ? 0 : getPart('hour'),
    getPart('minute'),
    getPart('second')
  );
}

export function formatCaliforniaDate(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d); // Returns "MM/DD/YYYY"
}

export function formatCaliforniaTime(date: Date | string | number): string {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  return formatter.format(d); // Returns e.g. "8:15 AM"
}
