import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "render.worldofwarcraft.com",
      },
      {
        protocol: "https",
        hostname: "**.blz-contentstack.com",
      },
      {
        protocol: "https",
        hostname: "render-*.worldofwarcraft.com",
      },
    ],
  },
};

export default nextConfig;
