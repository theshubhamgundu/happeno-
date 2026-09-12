import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  productionBrowserSourceMaps: false,
  compress: true,
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/aftermovie",
        destination: "https://www.youtube.com/watch?v=xKLlWAJvdDQ",
        permanent: false,
      },
      {
        source: "/prospectus",
        destination:
          "https://drive.google.com/file/d/1I5ZFxc1wKfJIN8JRd-9YV2HmfQkOblrr/view",
        permanent: false,
      },
      {
        source: "/chat",
        destination:
          "https://discord.com/invite/NTueHjdPn8",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
