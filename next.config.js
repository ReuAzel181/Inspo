/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', process.env.VERCEL_PROJECT_PRODUCTION_URL].filter(Boolean),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
