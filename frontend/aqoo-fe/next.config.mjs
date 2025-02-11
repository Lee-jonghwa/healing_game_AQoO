/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // Next.js 14에서 App Router 사용 가능
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "13.124.6.53", // 외부 이미지 도메인
        port: "", // 포트가 없으면 빈 문자열
        pathname: "/images/**", // 허용할 이미지 경로 패턴
      },
    ],
  },
};

export default nextConfig;
