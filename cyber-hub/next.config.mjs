/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Transpile Excalidraw for proper module resolution
  transpilePackages: ["@excalidraw/excalidraw"],
};

export default nextConfig;
