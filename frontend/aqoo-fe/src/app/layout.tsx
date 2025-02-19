// app/layout.tsx
"use client"; // 클라이언트 컴포넌트 설정

import "@/styles/globals.css"; // Tailwind 등 글로벌 스타일 적용
import BackgroundMusic from "@/components/BackgroundMusic";
import Navbar from "@/components/NavBar";
import RecoilProvider from "@/providers/RecoilProvider";
import { usePathname } from "next/navigation";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ✅ 네비게이션을 숨기고 싶은 페이지 리스트
  const hiddenNavPaths: string[] = [
    "/",
    "/user/login",
    "/register",
    "/some-other-page",
    // 추가로 네비게이션을 숨길 경로가 있다면 여기에 추가하세요.
  ];

  return (
    <html lang="ko">
      <head>
        {/* PWA 관련 태그 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="w-full min-h-screen sm:overflow-auto">
        <div className="relative w-full min-h-screen overflow-x-hidden">
          <RecoilProvider>
            <BackgroundMusic /> {/* 배경 음악 실행 */}
            {/* 특정 페이지에서만 네비게이션 렌더링 */}
            {!hiddenNavPaths.includes(pathname) && <Navbar />}
            <div className="w-full min-h-screen">{children}</div>
          </RecoilProvider>
        </div>
      </body>
    </html>
  );
}
