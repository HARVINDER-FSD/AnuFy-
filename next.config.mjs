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
  
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'mongoose', 'bcryptjs', 'jsonwebtoken'],
  },
}

export default nextConfig
