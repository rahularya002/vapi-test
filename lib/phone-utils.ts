/**
 * Phone number utilities for formatting and validation
 */

export function formatPhoneNumber(phone: string, defaultCountryCode: string = '+91'): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If already has country code, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // If starts with country code without +, add +
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // If starts with 0, remove it and add country code
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return defaultCountryCode + cleaned.substring(1);
  }
  
  // If 10 digits, add country code
  if (cleaned.length === 10) {
    return defaultCountryCode + cleaned;
  }
  
  // If 11 digits and starts with 1, might be US number
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }
  
  // If 12 digits, might already have country code
  if (cleaned.length === 12) {
    return '+' + cleaned;
  }
  
  // Default: add country code
  return defaultCountryCode + cleaned;
}

export function validatePhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
  const formatted = formatPhoneNumber(phone);
  
  // Basic E.164 validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  
  if (!e164Regex.test(formatted)) {
    return {
      isValid: false,
      formatted,
      error: 'Invalid phone number format. Must be in E.164 format (e.g., +91XXXXXXXXXX)'
    };
  }
  
  // Check length (should be between 7 and 15 digits after +)
  const digitsOnly = formatted.substring(1);
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      isValid: false,
      formatted,
      error: 'Phone number too short or too long'
    };
  }
  
  return {
    isValid: true,
    formatted
  };
}

export function getCountryCodeFromNumber(phone: string): string {
  if (phone.startsWith('+91')) return '+91'; // India
  if (phone.startsWith('+1')) return '+1';   // US/Canada
  if (phone.startsWith('+44')) return '+44'; // UK
  if (phone.startsWith('+61')) return '+61'; // Australia
  if (phone.startsWith('+86')) return '+86'; // China
  if (phone.startsWith('+81')) return '+81'; // Japan
  if (phone.startsWith('+49')) return '+49'; // Germany
  if (phone.startsWith('+33')) return '+33'; // France
  if (phone.startsWith('+39')) return '+39'; // Italy
  if (phone.startsWith('+34')) return '+34'; // Spain
  
  // Default to India
  return '+91';
}

export function formatPhoneForDisplay(phone: string): string {
  const formatted = formatPhoneNumber(phone);
  
  if (formatted.startsWith('+91')) {
    // Format Indian numbers: +91 XXXXX XXXXX
    const digits = formatted.substring(3);
    if (digits.length === 10) {
      return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
    }
  }
  
  if (formatted.startsWith('+1')) {
    // Format US numbers: +1 (XXX) XXX-XXXX
    const digits = formatted.substring(2);
    if (digits.length === 10) {
      return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
    }
  }
  
  return formatted;
}
