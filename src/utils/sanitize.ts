/**
 * Input sanitization utilities
 * Provides functions to clean and validate user inputs
 */

// HTML tags and attributes that are allowed
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br'];
const ALLOWED_ATTRIBUTES = ['class', 'id'];

// Characters that should be escaped
const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /data:/gi,
  /vbscript:/gi,
  /onload/gi,
  /onerror/gi,
  /onclick/gi,
  /onmouseover/gi,
  /onfocus/gi,
  /onblur/gi,
  /onchange/gi,
  /onsubmit/gi,
  /onreset/gi,
  /onselect/gi,
  /onkeydown/gi,
  /onkeyup/gi,
  /onkeypress/gi,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
];

export class Sanitizer {
  /**
   * Escape HTML special characters
   */
  static escapeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input.replace(/[&<>"'`=\/]/g, (char) => ESCAPE_MAP[char] || char);
  }

  /**
   * Remove all HTML tags
   */
  static stripHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * Remove dangerous patterns and scripts
   */
  static removeDangerousPatterns(input: string): string {
    if (typeof input !== 'string') return '';
    
    let cleaned = input;
    
    DANGEROUS_PATTERNS.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  /**
   * Sanitize HTML content (remove dangerous tags and attributes)
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove dangerous patterns first
    let cleaned = this.removeDangerousPatterns(input);
    
    // Remove all HTML tags except allowed ones
    cleaned = cleaned.replace(/<(?!(?:\/?(?:b|i|em|strong|p|br)\b))[^>]*>/gi, '');
    
    // Remove dangerous attributes from allowed tags
    cleaned = cleaned.replace(/\s(?!class|id)[a-zA-Z-]+=(["'])[^"']*\1/gi, '');
    
    return cleaned;
  }

  /**
   * Sanitize text input (remove HTML and escape special characters)
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove HTML tags
    let cleaned = this.stripHtml(input);
    
    // Escape special characters
    cleaned = this.escapeHtml(cleaned);
    
    // Remove dangerous patterns
    cleaned = this.removeDangerousPatterns(cleaned);
    
    return cleaned.trim();
  }

  /**
   * Sanitize username (alphanumeric, underscores, hyphens only)
   */
  static sanitizeUsername(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[^a-zA-Z0-9_-]/g, '') // Keep only alphanumeric, underscore, hyphen
      .replace(/^[-_]+|[-_]+$/g, '') // Remove leading/trailing hyphens/underscores
      .substring(0, 20); // Limit length
  }

  /**
   * Sanitize email (basic validation and cleaning)
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9@._-]/g, '') // Keep only valid email characters
      .substring(0, 254); // RFC 5321 limit
  }

  /**
   * Sanitize URL (basic validation)
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') return '';
    
    try {
      const url = new URL(input);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }
      
      return url.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: string | number): number {
    if (typeof input === 'number') {
      return isNaN(input) ? 0 : input;
    }
    
    if (typeof input !== 'string') return 0;
    
    const cleaned = input.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson(input: string): any {
    if (typeof input !== 'string') return null;
    
    try {
      const parsed = JSON.parse(input);
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Remove SQL injection patterns
   */
  static removeSqlInjection(input: string): string {
    if (typeof input !== 'string') return '';
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/gi,
      /(--|\#|\/\*|\*\/)/g,
      /(\b(script|javascript|vbscript|onload|onerror)\b)/gi,
    ];
    
    let cleaned = input;
    sqlPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned;
  }

  /**
   * Comprehensive sanitization for user input
   */
  static sanitizeUserInput(input: string, type: 'text' | 'html' | 'username' | 'email' | 'url' = 'text'): string {
    if (typeof input !== 'string') return '';
    
    switch (type) {
      case 'html':
        return this.sanitizeHtml(input);
      case 'username':
        return this.sanitizeUsername(input);
      case 'email':
        return this.sanitizeEmail(input);
      case 'url':
        return this.sanitizeUrl(input);
      case 'text':
      default:
        return this.sanitizeText(input);
    }
  }
}

// Export convenience functions
export const sanitize = {
  html: Sanitizer.sanitizeHtml,
  text: Sanitizer.sanitizeText,
  username: Sanitizer.sanitizeUsername,
  email: Sanitizer.sanitizeEmail,
  url: Sanitizer.sanitizeUrl,
  number: Sanitizer.sanitizeNumber,
  json: Sanitizer.sanitizeJson,
  userInput: Sanitizer.sanitizeUserInput,
  removeSqlInjection: Sanitizer.removeSqlInjection,
  removeDangerousPatterns: Sanitizer.removeDangerousPatterns,
};
