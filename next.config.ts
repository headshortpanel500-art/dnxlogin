import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The injected panel posts to `/api/validate-license/` with a trailing slash.
  // Next's default behaviour is a 308 to the slashless form, and whether that
  // redirect is followed depends on the WinHTTP client inside the packed DLL.
  // Skip the redirect so the path the client already uses is served directly.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
