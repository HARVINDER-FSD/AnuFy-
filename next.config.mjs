/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true, // Use SWC for minification (faster than Terser)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  // Image optimization
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    deviceSizes: [640, 750, 828, 1080, 1200], // Optimize device sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Optimize image sizes
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add optimization for production builds
    if (process.env.NODE_ENV === 'production' && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                if (!module.context) return 'npm.vendor';
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (!match) return 'npm.vendor';
                const packageName = match[1];
                return `npm.${packageName.replace('@', '')}`;
              },
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
    // Enable optimizations
    optimizeCss: true,
    scrollRestoration: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
        ],
      },
    ]
  },
}

export default nextConfig
