import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["tipper-lavender-saddlebag.ngrok-free.dev"],
  images: {
    qualities: [75, 92, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
};

export default nextConfig;