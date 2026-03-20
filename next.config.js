/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the Anthropic API to be called from API routes
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
