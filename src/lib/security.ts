// Security Utilities and Middleware
// Provides security measures for the e-commerce application

// Note: Install 'isomorphic-dompurify' for server-side HTML sanitization
// import DOMPurify from 'isomorphic-dompurify';

// Input sanitization and validation
export class SecurityUtils {
  // Sanitize HTML content to prevent XSS
  static sanitizeHTML(html: string): string {
    if (typeof window !== 'undefined') {
      // Client-side sanitization - fallback if DOMPurify not available
      try {
        // @ts-ignore - DOMPurify might not be installed
        const DOMPurify = require('isomorphic-dompurify');
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
          ALLOWED_ATTR: []
        });
      } catch {
        // Fallback sanitization
        return html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    } else {
      // Server-side - basic sanitization
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  }

  // Sanitize text input
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .slice(0, 10000); // Limit length
  }

  // Sanitize email
  static sanitizeEmail(email: string): string {
    return email
      .toLowerCase()
      .trim()
      .replace(/[<>\s]/g, '') // Remove spaces and HTML tags
      .slice(0, 254); // RFC 5321 limit
  }

  // Sanitize URL
  static sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }

  // Validate and sanitize phone number
  static sanitizePhone(phone: string): string {
    return phone
      .replace(/[^\d+\-\s()]/g, '') // Keep only digits, +, -, spaces, parentheses
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .slice(0, 20); // Reasonable limit
  }

  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }

    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash password (client-side - for validation only)
  static async hashPassword(password: string): Promise<string> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('Crypto API not available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    return {
      isValid: feedback.length === 0,
      score,
      feedback
    };
  }

  // Rate limiting helper
  static checkRateLimit(
    key: string,
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    // In a real implementation, you would store this in Redis or a database
    // For now, we'll use localStorage (client-side) or a simple in-memory store (server-side)

    if (typeof window !== 'undefined') {
      // Client-side rate limiting using localStorage
      const stored = localStorage.getItem(`rate_limit_${key}`);
      const requests = stored ? JSON.parse(stored) : [];

      // Filter out old requests
      const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);

      if (validRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        return {
          allowed: false,
          resetTime: oldestRequest + windowMs
        };
      }

      // Add current request
      validRequests.push(now);
      localStorage.setItem(`rate_limit_${key}`, JSON.stringify(validRequests));

      return { allowed: true };
    } else {
      // Server-side - would use Redis or database
      return { allowed: true };
    }
  }

  // CSRF token generation and validation
  static generateCSRFToken(): string {
    return this.generateSecureToken(40);
  }

  static validateCSRFToken(token: string, sessionToken: string): boolean {
    // In a real implementation, you would compare with the session token
    return token === sessionToken && token.length > 0;
  }

  // Content Security Policy headers
  static getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on your needs
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'"
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  // Input validation schemas
  static validateProductInput(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.length > 255) {
      errors.push('Product name must be a string between 1 and 255 characters');
    }

    if (data.description && (typeof data.description !== 'string' || data.description.length > 2000)) {
      errors.push('Product description must be a string up to 2000 characters');
    }

    if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
      errors.push('Product price must be a positive number');
    }

    if (!data.sku || typeof data.sku !== 'string' || data.sku.length > 100) {
      errors.push('Product SKU must be a string up to 100 characters');
    }

    if (data.stockQuantity !== undefined && (typeof data.stockQuantity !== 'number' || data.stockQuantity < 0)) {
      errors.push('Stock quantity must be a non-negative number');
    }

    if (!data.categoryId || typeof data.categoryId !== 'string') {
      errors.push('Category ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCustomerInput(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email address is required');
    }

    if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.length > 100) {
      errors.push('First name must be a string up to 100 characters');
    }

    if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.length > 100) {
      errors.push('Last name must be a string up to 100 characters');
    }

    if (data.phone && !/^[\d+\-\s()]{10,20}$/.test(data.phone.replace(/\s/g, ''))) {
      errors.push('Phone number format is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateOrderInput(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.customerId || typeof data.customerId !== 'string') {
      errors.push('Customer ID is required');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Order items array is required and cannot be empty');
    } else {
      data.items.forEach((item: any, index: number) => {
        if (!item.productId || typeof item.productId !== 'string') {
          errors.push(`Item ${index + 1}: Product ID is required`);
        }

        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be a positive number`);
        }

        if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
          errors.push(`Item ${index + 1}: Price must be a positive number`);
        }
      });
    }

    if (!data.shippingAddress || typeof data.shippingAddress !== 'object') {
      errors.push('Shipping address is required');
    } else {
      const addressErrors = this.validateAddressInput(data.shippingAddress);
      errors.push(...addressErrors.map(error => `Shipping: ${error}`));
    }

    if (!data.billingAddress || typeof data.billingAddress !== 'object') {
      errors.push('Billing address is required');
    } else {
      const addressErrors = this.validateAddressInput(data.billingAddress);
      errors.push(...addressErrors.map(error => `Billing: ${error}`));
    }

    if (!data.paymentMethod || typeof data.paymentMethod !== 'string') {
      errors.push('Payment method is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAddressInput(address: any): string[] {
    const errors: string[] = [];

    if (!address.fullName || typeof address.fullName !== 'string') {
      errors.push('Full name is required');
    }

    if (!address.addressLine1 || typeof address.addressLine1 !== 'string') {
      errors.push('Address line 1 is required');
    }

    if (!address.city || typeof address.city !== 'string') {
      errors.push('City is required');
    }

    if (!address.state || typeof address.state !== 'string') {
      errors.push('State is required');
    }

    if (!address.postalCode || typeof address.postalCode !== 'string') {
      errors.push('Postal code is required');
    }

    if (!address.country || typeof address.country !== 'string') {
      errors.push('Country is required');
    }

    return errors;
  }

  // SQL injection prevention (basic)
  static sanitizeSQLInput(input: string): string {
    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove comment starts
      .replace(/\*\//g, '') // Remove comment ends
      .trim();
  }

  // File upload validation
  static validateFileUpload(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    } = options;

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Security headers middleware
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()'
      ].join(', ')
    };
  }

  // API key validation
  static validateAPIKey(apiKey: string, validKeys: string[]): boolean {
    return validKeys.includes(apiKey) && apiKey.length > 0;
  }

  // JWT token validation (basic)
  static validateJWTStructure(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Basic format validation
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      return header.typ === 'JWT' && typeof payload.exp === 'number';
    } catch {
      return false;
    }
  }

  // Secure session configuration
  static getSecureSessionConfig(): any {
    return {
      secret: process.env.SESSION_SECRET || this.generateSecureToken(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      }
    };
  }
}

// Security middleware for API routes
export class SecurityMiddleware {
  // CORS configuration
  static getCORSConfig() {
    return {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
  }

  // Request sanitization middleware
  static sanitizeRequest(req: any, res: any, next: any) {
    // Sanitize request body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize route parameters
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  // Recursively sanitize object properties
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return SecurityUtils.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};

      Object.keys(obj).forEach(key => {
        const value = obj[key];

        if (typeof value === 'string') {
          // Sanitize based on field name
          if (key.toLowerCase().includes('email')) {
            sanitized[key] = SecurityUtils.sanitizeEmail(value);
          } else if (key.toLowerCase().includes('phone')) {
            sanitized[key] = SecurityUtils.sanitizePhone(value);
          } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
            sanitized[key] = SecurityUtils.sanitizeURL(value);
          } else if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
            sanitized[key] = SecurityUtils.sanitizeHTML(value);
          } else {
            sanitized[key] = SecurityUtils.sanitizeText(value);
          }
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      });

      return sanitized;
    }

    return obj;
  }

  // Authentication middleware
  static requireAuth(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);

    if (!SecurityUtils.validateJWTStructure(token)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }

    // In a real implementation, you would verify the JWT signature
    req.user = { id: 'user-id-from-token' }; // Extract from token
    next();
  }

  // Admin authorization middleware
  static requireAdmin(req: any, res: any, next: any) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();
  }

  // Rate limiting middleware
  static rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    const requests = new Map<string, number[]>();

    return (req: any, res: any, next: any) => {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!requests.has(key)) {
        requests.set(key, []);
      }

      const userRequests = requests.get(key)!;

      // Remove old requests
      while (userRequests.length > 0 && userRequests[0] < windowStart) {
        userRequests.shift();
      }

      if (userRequests.length >= maxRequests) {
        const resetTime = userRequests[0] + windowMs;

        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((resetTime - now) / 1000)
        });
      }

      userRequests.push(now);
      next();
    };
  }

  // Input validation middleware
  static validateInput(schema: any) {
    return (req: any, res: any, next: any) => {
      const { error } = schema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map((detail: any) => detail.message)
        });
      }

      next();
    };
  }
}

// Export security utilities
export default SecurityUtils;