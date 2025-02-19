import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    appDir: true, // Next.js 14에서 App Router 사용 가능
  },
  images: {
    domains: ['i12e203.p.ssafy.io'], // ✅ 외부 이미지 도메인 추가
  },
};

export default withPWA({
  dest: 'public', // 빌드시 생성될 Service Worker 관련 파일들이 public 폴더에 저장됩니다.
  disable: process.env.NODE_ENV === 'development', // 개발 환경에서는 PWA 비활성화
  ...nextConfig,
});
