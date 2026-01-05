/**
 * Formatting utilities for dates, currency, and other display values
 */

/**
 * Formats a date string or Date object into a readable format
 *
 * @param date - Date to format
 * @param format - Format pattern (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2024-06-01'), 'MMM dd, yyyy') // "Jun 01, 2024"
 * formatDate('2024-06-01') // "Jun 01, 2024"
 */
export function formatDate(date: Date | string, format: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();

  let formatted = format;
  formatted = formatted.replace('MMMM', monthsFull[month]);
  formatted = formatted.replace('MMM', months[month]);
  formatted = formatted.replace('MM', String(month + 1).padStart(2, '0'));
  formatted = formatted.replace('dd', String(day).padStart(2, '0'));
  formatted = formatted.replace('yyyy', String(year));
  formatted = formatted.replace('yy', String(year).slice(-2));

  return formatted;
}

/**
 * Formats a number as currency
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(99.99, 'USD') // "$99.99"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formats duration in minutes to readable format
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "2h 30m")
 *
 * @example
 * formatDuration(150) // "2h 30m"
 * formatDuration(45) // "45m"
 * formatDuration(60) // "1h"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Formats time from ISO string or Date to HH:MM format
 *
 * @param time - Time to format (ISO string or Date)
 * @param use24Hour - Whether to use 24-hour format (default: true)
 * @returns Formatted time string
 *
 * @example
 * formatTime('2024-06-01T14:30:00') // "14:30"
 * formatTime('2024-06-01T14:30:00', false) // "2:30 PM"
 */
export function formatTime(time: Date | string, use24Hour: boolean = true): string {
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  const hours = timeObj.getHours();
  const minutes = timeObj.getMinutes();

  if (use24Hour) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }
}

/**
 * Formats a number with thousands separators
 *
 * @param num - Number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234567.89, 'de-DE') // "1.234.567,89"
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Truncates text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncating
 * @returns Truncated text with ellipsis if needed
 *
 * @example
 * truncateText('This is a long text', 10) // "This is a..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}
