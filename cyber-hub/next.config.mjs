/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/Shebang",
  assetPrefix: "/Shebang/",
  images: {
    unoptimized: true,
  },
  // Transpile Excalidraw for proper module resolution
  transpilePackages: ["@excalidraw/excalidraw"],
};

export default nextConfig;
