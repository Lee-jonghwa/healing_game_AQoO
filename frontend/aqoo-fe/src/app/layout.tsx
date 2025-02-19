// app/layout.tsx
"use client"; // 클라이언트 컴포넌트 설정

import Script from "next/script";
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
        {/* iOS 홈 화면 아이콘 */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icon/icon-180.png" />

        {/* Google Tag Manager 스크립트 */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PK6QF66G');
          `}
        </Script>
      </head>
      <body className="w-full min-h-screen sm:overflow-auto">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PK6QF66G"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
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
