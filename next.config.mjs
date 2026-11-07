/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No external image domains needed; all data is text.
  images: {
    domains: [],
  },
};

export default nextConfig;