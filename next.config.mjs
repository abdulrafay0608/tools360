/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  eslint: {
	// Ignore ESLint on Build Time
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
