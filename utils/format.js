/**
 * Data Formatting Utilities
 * Provides consistent formatting for dates, currency, time, numbers, and other data types
 */

/**
 * @typedef {Object} CurrencyOptions
 * @property {string} [currency] - The currency code
 * @property {string} [locale] - The locale to use for formatting
 * @property {string} [symbol] - The currency symbol
 * @property {'before' | 'after'} [symbolPosition] - Position of the currency symbol
 * @property {number} [decimals] - Number of decimal places
 * @property {string} [thousandsSeparator] - Character for thousands separator
 * @property {string} [decimalSeparator] - Character for decimal separator
 */

/**
 * @typedef {Object} DateFormatOptions
 * @property {'short' | 'medium' | 'long' | 'full' | 'time' | 'datetime' | 'relative'} [format] - Format style
 * @property {string} [locale] - The locale to use for formatting
 * @property {string} [timeZone] - The timezone to use
 * @property {boolean} [showTime] - Whether to show time
 * @property {boolean} [showSeconds] - Whether to show seconds
 * @property {boolean} [use24Hour] - Whether to use 24-hour format
 */

/**
 * Format currency amount
 * @param {number | string} amount - The amount to format
 * @param {CurrencyOptions} [options={}] - Formatting options
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = 'LKR',
    locale = 'en-US',
    symbol = currency === 'LKR' ? 'Rs.' : undefined,
    symbolPosition = 'before',
    decimals = currency === 'LKR' ? 0 : 2,
    thousandsSeparator = ',',
    decimalSeparator = '.',
  } = options;

  let value = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle cents conversion for certain currencies
  if (currency === 'LKR' && value > 1000) {
    value = value / 100;
  }

  if (isNaN(value)) return '0';

  // Format the number
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value));

  // Apply custom separators if different from locale default
  let result = formatted;
  if (thousandsSeparator !== ',' || decimalSeparator !== '.') {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/,/g, thousandsSeparator);
    result = parts.join(decimalSeparator);
  }

  // Add currency symbol
  const currencySymbol = symbol || currency;
  const finalAmount = symbolPosition === 'before'
    ? `${currencySymbol} ${result}`
    : `${result} ${currencySymbol}`;

  // Handle negative values
  return value < 0 ? `-${finalAmount}` : finalAmount;
};

/**
 * Format date with various options
 * @param {Date | string | number} date - The date to format
 * @param {DateFormatOptions} [options={}] - Formatting options
 * @returns {string} The formatted date string
 */
export const formatDate = (date, options = {}) => {
  const {
    format = 'medium',
    locale = 'en-US',
    timeZone = 'UTC',
    showTime = false,
    showSeconds = false,
    use24Hour = false,
  } = options;

  let dateObj;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  if (format === 'relative') {
    return formatRelativeTime(dateObj);
  }

  /** @type {Intl.DateTimeFormatOptions} */
  let formatOptions = {
    timeZone,
  };

  switch (format) {
    case 'short':
      formatOptions = {
        ...formatOptions,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      break;

    case 'medium':
      formatOptions = {
        ...formatOptions,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      break;

    case 'long':
      formatOptions = {
        ...formatOptions,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      break;

    case 'full':
      formatOptions = {
        ...formatOptions,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        era: 'short',
      };
      break;

    case 'time':
      formatOptions = {
        ...formatOptions,
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24Hour,
      };
      if (showSeconds) {
        formatOptions.second = '2-digit';
      }
      break;

    case 'datetime':
      formatOptions = {
        ...formatOptions,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24Hour,
      };
      if (showSeconds) {
        formatOptions.second = '2-digit';
      }
      break;
  }

  // Add time to date formats if requested
  if (showTime && !['time', 'datetime'].includes(format)) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    formatOptions.hour12 = !use24Hour;
    if (showSeconds) {
      formatOptions.second = '2-digit';
    }
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
};

/**
 * Format relative time (time ago)
 * @param {Date | string | number} date - The date to format
 * @returns {string} The relative time string
 */
export const formatRelativeTime = (date) => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return 'in the future';
  }

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
  }

  return 'just now';
};

/**
 * Format duration in minutes to human readable format
 * @param {number | string} minutes - The duration in minutes
 * @param {{ format?: 'short' | 'long', showSeconds?: boolean }} [options={}] - Formatting options
 * @returns {string} The formatted duration string
 */
export const formatDuration = (minutes, options = {}) => {
  const { format = 'short', showSeconds = false } = options;

  let totalMinutes = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (isNaN(totalMinutes) || totalMinutes < 0) return '0m';

  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.floor(totalMinutes % 60);
  const seconds = showSeconds ? Math.floor((totalMinutes % 1) * 60) : 0;

  if (format === 'long') {
    const parts = [];
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }
    if (mins > 0) {
      parts.push(`${mins} ${mins === 1 ? 'minute' : 'minutes'}`);
    }
    if (showSeconds && seconds > 0) {
      parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
    }
    return parts.length > 0 ? parts.join(', ') : '0 minutes';
  }

  // Short format
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || hours === 0) parts.push(`${mins}m`);
  if (showSeconds && seconds > 0) parts.push(`${seconds}s`);

  return parts.length > 0 ? parts.join(' ') : '0m';
};

/**
 * Format numbers with appropriate suffixes (K, M, B)
 * @param {number} num - The number to format
 * @param {{ decimals?: number, compact?: boolean, locale?: string }} [options={}] - Formatting options
 * @returns {string} The formatted number string
 */
export const formatNumber = (num, options = {}) => {
  const { decimals = 1, compact = true, locale = 'en-US' } = options;

  if (isNaN(num)) return '0';

  if (!compact) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(num);
  }

  // Compact formatting
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(decimals).replace(/\.0+$/, '') + 'B';
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(decimals).replace(/\.0+$/, '') + 'M';
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(decimals).replace(/\.0+$/, '') + 'K';
  }

  return num.toString();
};

/**
 * Format percentage
 * @param {number} value - The value to format as percentage
 * @param {{ decimals?: number, showSign?: boolean, locale?: string }} [options={}] - Formatting options
 * @returns {string} The formatted percentage string
 */
export const formatPercentage = (value, options = {}) => {
  const { decimals = 1, showSign = true, locale = 'en-US' } = options;

  if (isNaN(value)) return '0%';

  const formatted = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);

  if (!showSign) {
    return formatted.replace('%', '');
  }

  return formatted;
};

/**
 * Format file size in bytes to human readable format
 * @param {number | string} bytes - The size in bytes
 * @returns {string} The formatted file size string
 */
export const formatFileSize = (bytes) => {
  const size = typeof bytes === 'string' ? parseFloat(bytes) : bytes;

  if (isNaN(size) || size === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(Math.abs(size)) / Math.log(1024));
  const formattedSize = (size / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);

  return `${formattedSize} ${sizes[i]}`;
};

/**
 * Format phone number with proper formatting
 * @param {string} phone - The phone number to format
 * @param {string} [country='LK'] - The country code
 * @returns {string} The formatted phone number
 */
export const formatPhone = (phone, country = 'LK') => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  switch (country) {
    case 'LK':
      if (cleaned.startsWith('94') && cleaned.length === 11) {
        return `+94 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
      }
      if (cleaned.startsWith('0') && cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      }
      break;

    case 'US':
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      break;
  }

  return phone; // Return original if no formatting rules match
};

/**
 * Format name (proper case)
 * @param {string} name - The name to format
 * @returns {string} The formatted name
 */
export const formatName = (name) => {
  if (!name || typeof name !== 'string') return '';

  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get initials from name
 * @param {string} name - The name to get initials from
 * @param {number} [maxInitials=2] - Maximum number of initials
 * @returns {string} The initials
 */
export const getInitials = (name, maxInitials = 2) => {
  if (!name || typeof name !== 'string') return '';

  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  // Take first and last name initials, or first N initials if specified
  if (maxInitials === 2 && parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  return parts
    .slice(0, maxInitials)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

/**
 * Create URL-friendly slug from text
 * @param {string} text - The text to slugify
 * @returns {string} The URL-friendly slug
 */
export const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {{ length?: number, ending?: string, wordBoundary?: boolean }} [options={}] - Truncation options
 * @returns {string} The truncated text
 */
export const truncate = (text, options = {}) => {
  const { length = 100, ending = '...', wordBoundary = true } = options;

  if (!text || typeof text !== 'string') return '';
  if (text.length <= length) return text;

  let truncated = text.slice(0, length - ending.length);

  if (wordBoundary) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace);
    }
  }

  return truncated + ending;
};

/**
 * Format address components
 * @param {{ street?: string, city?: string, state?: string, postalCode?: string, country?: string }} address - The address components
 * @returns {string} The formatted address
 */
export const formatAddress = (address) => {
  const { street, city, state, postalCode, country } = address;

  const parts = [
    street,
    city,
    state,
    postalCode,
    country,
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Format credit card number with masking
 * @param {string} number - The credit card number
 * @param {{ mask?: boolean, separator?: string, maskChar?: string, showLast?: number }} [options={}] - Formatting options
 * @returns {string} The formatted credit card number
 */
export const formatCreditCard = (number, options = {}) => {
  const { mask = true, separator = ' ', maskChar = '*', showLast = 4 } = options;

  if (!number) return '';

  const cleaned = number.replace(/\D/g, '');

  if (mask) {
    const masked = maskChar.repeat(Math.max(0, cleaned.length - showLast));
    const visible = cleaned.slice(-showLast);
    const combined = masked + visible;

    // Add separators every 4 digits
    return combined.replace(/(.{4})/g, `$1${separator}`).trim();
  }

  // Add separators every 4 digits without masking
  return cleaned.replace(/(.{4})/g, `$1${separator}`).trim();
};

/**
 * Format social security or identification numbers
 * @param {string} number - The ID number
 * @param {string} [pattern='XXX-XX-XXXX'] - The formatting pattern
 * @param {string} [maskChar='X'] - The mask character
 * @returns {string} The formatted ID number
 */
export const formatIdNumber = (number, pattern = 'XXX-XX-XXXX', maskChar = 'X') => {
  if (!number) return '';

  const cleaned = number.replace(/\D/g, '');
  let formatted = '';
  let numberIndex = 0;

  for (let i = 0; i < pattern.length && numberIndex < cleaned.length; i++) {
    if (pattern[i] === maskChar) {
      formatted += cleaned[numberIndex];
      numberIndex++;
    } else {
      formatted += pattern[i];
    }
  }

  return formatted;
};