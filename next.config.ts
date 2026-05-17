import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.pinggy.link",
    "*.pinggy-free.link",
    "*.run.pinggy-free.link",
    "*.free.pinggy.link",
    "*.a.free.pinggy.link",
  ],
  turbopack: {},
};

export default nextConfig;
