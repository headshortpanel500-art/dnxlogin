import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The injected panel posts to `/api/validate-license/` with a trailing slash.
  // Next's default behaviour is a 308 to the slashless form, and whether that
  // redirect is followed depends on the WinHTTP client inside the packed DLL.
  // Skip the redirect so the path the client already uses is served directly.
  skipTrailingSlashRedirect: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
