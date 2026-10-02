import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Placeholder images for development only — swap for the Supabase
      // storage bucket domain once product images are uploaded there.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
