/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Basic optimizations
  compress: true,
  poweredByHeader: false,
  
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: ['mongodb', 'mongoose'],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Aggressive cache prevention for development and deployment
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // Generate unique build IDs to force cache invalidation
  generateBuildId: async () => {
    // Import version from cache manager
    const version = process.env.APP_VERSION || Date.now()
    return `build-${version}`
  },
  
  // Add version to all pages
  env: {
    APP_VERSION: '1.0.3',
  },
}

export default nextConfig
