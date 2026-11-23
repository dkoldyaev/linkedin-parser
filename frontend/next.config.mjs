import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(import.meta.dirname, '..'),
  turbopack: {
    root: path.resolve(import.meta.dirname, '..'),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  transpilePackages: ['@blueprint/ui-kit'],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL;
    if (!backendUrl || backendUrl.trim() === '') {
      throw new Error('Fatal configuration error: BACKEND_INTERNAL_URL environment variable is required and not set.');
    }
    const cleanBackendUrl = backendUrl.replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${cleanBackendUrl}/api/:path*`,
      },
      {
        source: '/admin',
        destination: `${cleanBackendUrl}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${cleanBackendUrl}/admin/:path*`,
      },
      {
        source: '/bundles/:path*',
        destination: `${cleanBackendUrl}/bundles/:path*`,
      },
      {
        source: '/admin-assets/:path*',
        destination: `${cleanBackendUrl}/admin-assets/:path*`,
      },
      {
        source: '/extension.zip',
        destination: `${cleanBackendUrl}/extension.zip`,
      },
      {
        source: '/.well-known/:path*',
        destination: `${cleanBackendUrl}/.well-known/:path*`,
      },
    ];
  },
};

export default nextConfig;
