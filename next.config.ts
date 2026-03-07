import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Production optimizations
  poweredByHeader: false,
  compress: process.env.NODE_ENV === 'production',
  
  // SEO optimizations
  trailingSlash: false,
  generateEtags: true,
  
  // TypeScript configuration
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // Disable static optimization to avoid useSearchParams issues
  output: 'standalone',
  
  // Image optimization
  images: {
    // Disable image optimization in development to prevent caching
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.imagekit.io',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Custom loader to bypass Next.js optimization for ImageKit URLs
    // ImageKit handles transformations via URL parameters
    loader: 'custom',
    loaderFile: './src/lib/imagekit-loader.ts',
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env['CUSTOM_KEY'],
  },

  // Headers for security and cache control
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Disable caching in development
          ...(isDevelopment ? [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ] : []),
        ],
      },
      // Static assets caching (production only)
      ...(isDevelopment ? [] : [
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        // Images caching (production only)
        {
          source: '/(.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp))',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=86400, s-maxage=31536000',
            },
          ],
        },
        // Favicon specific caching
        {
          source: '/(favicon\\.ico|icon|apple-icon)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        // Semi-static API routes - Short cache (production only)
        {
          source: '/api/(products|categories)(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=300, s-maxage=600',
            },
          ],
        },
        // HTML pages caching (production only)
        {
          source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=3600, s-maxage=86400',
            },
          ],
        },
      ]),
      // Dynamic API routes - NO CACHING (always)
      {
        source: '/api/(cart|orders|auth|users|checkout|wishlist|payments)(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000'}/api/:path*`,
      },
    ];
  },

};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "scarlet",
  project: process.env.SENTRY_PROJECT || "scarlet-frontend",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
