/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com", // อนุญาตให้โหลดรูปจากเว็บนี้
      },
    ],
  },
};

export default nextConfig;