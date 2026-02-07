import { Injectable } from "@nestjs/common";

@Injectable()
export class SecurityMiddlewareService {
  constructor() {}

  /**
   * Generate Content Security Policy header
   */
  getCSPHeader(): string {
    return `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://v6.vbb.transport.rest https://sentry.io wss: https:;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ");
  }

  /**
   * Get security headers
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      "Content-Security-Policy": this.getCSPHeader(),
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
    };
  }

  /**
   * Get CORS configuration
   */
  getCORSConfig() {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL,
    ].filter(Boolean);

    return {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
      ],
    };
  }
}
