import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
  },
  /* config options here */
  env: {
    CANONICAL_URL: 'https://cinema4arab.online',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  // Cloudflare Pages doesn't support host-based redirects in next.config
  // Use Cloudflare Workers or _redirects file instead if needed
  async redirects() {
    return [];
  },
};

// Setup Cloudflare adapter for development
if (process.env.NODE_ENV === 'development') {
  setupDevPlatform().catch(console.error);
}

export default nextConfig;
