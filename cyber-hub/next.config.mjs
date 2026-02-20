/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  ...(isProd && {
    output: "export",
    basePath: "/Shebang",
    assetPrefix: "/Shebang/",
  }),
  images: {
    unoptimized: true,
  },
  // Transpile Excalidraw for proper module resolution
  transpilePackages: ["@excalidraw/excalidraw"],
};

export default nextConfig;
