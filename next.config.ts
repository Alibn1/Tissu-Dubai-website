import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import {initOpenNextCloudflareForDev} from '@opennextjs/cloudflare';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Gives `getCloudflareContext()` a real binding set during `next dev`, so the
// D1 code path can be exercised locally. Deliberately limited to development:
// the helper starts a miniflare/workerd instance, and letting that happen while
// `next build` or `opennextjs-cloudflare build` loads this file leaves a
// workerd process holding the build output directory open. Not awaited by
// design.
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}

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
              // Playfair Display is @font-face'd straight from
              // fonts.gstatic.com in globals.css. Self-hosting it would let
              // this drop to 'self'.
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
