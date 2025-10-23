/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  
  // Force all API routes to be dynamic
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'mongoose', 'bcryptjs', 'jsonwebtoken'],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'lottie-react': 'lottie-react',
        'socket.io-client': 'socket.io-client',
      });
    }
    return config;
  },
}

export default nextConfig
