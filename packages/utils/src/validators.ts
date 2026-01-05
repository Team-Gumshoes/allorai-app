/**
 * Validation utilities for common data formats
 */

/**
 * Validates an email address
 *
 * @param email - Email address to validate
 * @returns True if valid email format
 *
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email') // false
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a date string (YYYY-MM-DD format)
 *
 * @param dateString - Date string to validate
 * @returns True if valid date format and valid date
 *
 * @example
 * validateDate('2024-06-01') // true
 * validateDate('2024-13-01') // false (invalid month)
 * validateDate('invalid') // false
 */
export function validateDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validates an IATA airport code (3 letters)
 *
 * @param code - Airport code to validate
 * @returns True if valid IATA format
 *
 * @example
 * validateAirportCode('JFK') // true
 * validateAirportCode('LAX') // true
 * validateAirportCode('AB') // false (too short)
 * validateAirportCode('ABCD') // false (too long)
 */
export function validateAirportCode(code: string): boolean {
  const airportCodeRegex = /^[A-Z]{3}$/;
  return airportCodeRegex.test(code.toUpperCase());
}

/**
 * Validates a phone number (basic validation)
 *
 * @param phone - Phone number to validate
 * @returns True if valid phone format
 *
 * @example
 * validatePhone('+1-234-567-8900') // true
 * validatePhone('(123) 456-7890') // true
 * validatePhone('123-456-7890') // true
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates a credit card number using Luhn algorithm
 *
 * @param cardNumber - Credit card number to validate
 * @returns True if valid according to Luhn algorithm
 *
 * @example
 * validateCreditCard('4532015112830366') // true (valid test card)
 * validateCreditCard('1234567890123456') // false
 */
export function validateCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validates a postal/ZIP code
 *
 * @param postalCode - Postal code to validate
 * @param countryCode - Country code (US, CA, UK, etc.)
 * @returns True if valid for the specified country
 *
 * @example
 * validatePostalCode('12345', 'US') // true
 * validatePostalCode('M5H 2N2', 'CA') // true
 * validatePostalCode('SW1A 1AA', 'UK') // true
 */
export function validatePostalCode(postalCode: string, countryCode: string = 'US'): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    UK: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
  };

  const pattern = patterns[countryCode.toUpperCase()];
  return pattern ? pattern.test(postalCode) : false;
}

/**
 * Validates that a value is within a numeric range
 *
 * @param value - Value to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if value is within range
 *
 * @example
 * validateRange(5, 1, 10) // true
 * validateRange(15, 1, 10) // false
 */
export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates a URL
 *
 * @param url - URL to validate
 * @returns True if valid URL format
 *
 * @example
 * validateUrl('https://example.com') // true
 * validateUrl('http://example.com/path') // true
 * validateUrl('not-a-url') // false
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
