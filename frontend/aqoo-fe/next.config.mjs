import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    appDir: true, // Next.js 14에서 App Router 사용 가능
  },
  images: {
    domains: ["i12e203.p.ssafy.io"],
  },
};

export default withPWA({
  dest: "public", // SW 파일 등 PWA 관련 파일이 저장될 경로
  disable: process.env.NODE_ENV === "development", // 개발 환경에서는 PWA 비활성화
})(nextConfig);
