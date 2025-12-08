/**
 * Utility functions for timezone conversion
 * Converts between GMT/UTC and IST (Indian Standard Time)
 */

/**
 * Get current IST time
 * @returns Current date/time in IST
 */
export function getCurrentIST(): Date {
  // Get current UTC time and convert to IST
  const now = new Date();
  
  // Convert to IST by getting the time in Asia/Kolkata timezone
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  return istTime;
}

/**
 * Parse API timestamp (in UTC) and return as Date WITHOUT timezone conversion
 * @param apiTimestamp - Timestamp from API (e.g., "2025-12-02T12:00:00.000Z")
 * @returns Date object representing the UTC time (12:00 stays as 12:00, not converted to 5:30 PM IST)
 */
export function parseAPITimestamp(apiTimestamp: string): Date {
  if (!apiTimestamp) {
    return new Date();
  }
  
  // ✅ Parse the UTC timestamp directly without timezone conversion
  // This keeps 12:00 UTC as 12:00, not converting it to 5:30 PM IST
  const utcDate = new Date(apiTimestamp);
  
  console.log(`🕐 [TIMEZONE] Parsing API timestamp WITHOUT conversion:`, {
    'API Timestamp (UTC)': apiTimestamp,
    'Parsed Date Object': utcDate,
    'UTC String': utcDate.toUTCString(),
    'ISO String': utcDate.toISOString(),
    'Display Time (No Conversion)': utcDate.toLocaleTimeString('en-IN', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // ✅ Use UTC to prevent automatic conversion
    })
  });
  
  return utcDate;
}

/**
 * Format date to time string WITHOUT timezone conversion
 * @param date - Date object
 * @param format - 'time' | 'date' | 'datetime'
 * @returns Formatted string without timezone conversion (12:00 UTC displays as 12:00 pm)
 */
export function formatIST(date: Date, format: 'time' | 'date' | 'datetime' = 'time'): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC', // ✅ Use UTC to prevent conversion
    hour12: true,
  };

  if (format === 'time') {
    options.hour = 'numeric';
    options.minute = '2-digit';
  } else if (format === 'date') {
    options.year = 'numeric';
    options.month = 'short';
    options.day = 'numeric';
  } else if (format === 'datetime') {
    options.year = 'numeric';
    options.month = 'short';
    options.day = 'numeric';
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Convert UTC/GMT time to IST (UTC+5:30)
 * @param utcDate - Date in UTC/GMT format (from API)
 * @returns Date object adjusted to IST
 * @deprecated Use parseAPITimestamp instead
 */
export function convertUTCtoIST(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Convert to IST timezone
  const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istString);
  
  return istDate;
}

/**
 * Convert IST time to UTC/GMT
 * @param istDate - Date in IST format
 * @returns Date object adjusted to UTC
 * @deprecated Use standard Date operations instead
 */
export function convertISTtoUTC(istDate: Date): Date {
  // IST is UTC+5:30, so subtract to get UTC
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  
  return new Date(istDate.getTime() - istOffset);
}