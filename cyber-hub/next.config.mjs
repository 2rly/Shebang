/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Transpile Excalidraw for proper module resolution
  transpilePackages: ["@excalidraw/excalidraw"],
  // better-sqlite3 is a native module — keep it out of the webpack bundle
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
