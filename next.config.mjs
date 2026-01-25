/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async rewrites() {
    // If something requests /next/static/..., serve from /_next/static/... (correct path)
    return [
      { source: '/next/static/:path*', destination: '/_next/static/:path*' },
    ];
  },
};

export default nextConfig;


