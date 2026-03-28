/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Transpile Excalidraw for proper module resolution
  transpilePackages: ["@excalidraw/excalidraw"],
  // better-sqlite3 is a native module — keep it out of the webpack bundle
  serverExternalPackages: ["better-sqlite3"],
  devIndicators: false,
  // Serve uploaded files via API route (bypasses static file caching issues)
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/serve-upload/:path*",
      },
    ];
  },
};

export default nextConfig;
