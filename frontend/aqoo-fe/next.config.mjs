/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    appDir: true, // Next.js 14에서 App Router 사용 가능
  },
  images: {
    domains: ["i12e203.p.ssafy.io"], // ✅ 외부 이미지 도메인 추가
  },
};

export default nextConfig;
