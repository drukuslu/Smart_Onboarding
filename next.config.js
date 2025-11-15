/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'FrictionlessAuthLayer',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },
}

module.exports = nextConfig
