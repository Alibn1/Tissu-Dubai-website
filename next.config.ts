import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForBuild: false
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'X-Frame-Options', value: 'DENY'},
          {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
          {key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains'},
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "form-action 'self'",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // The four brand faces (Playfair, Inter, Noto Naskh, IBM Plex
              // Arabic) are @font-face'd straight from fonts.gstatic.com in
              // globals.css. Self-hosting them would let this drop to 'self'.
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self'",
              // Store address map on the footer, /localisation and the home
              // page store section.
              "frame-src https://www.google.com",
            ].join('; ')
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  }
};

export default withNextIntl(nextConfig);
