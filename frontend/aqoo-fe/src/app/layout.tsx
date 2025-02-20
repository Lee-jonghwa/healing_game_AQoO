// app/layout.tsx
"use client";

import "@/styles/globals.css";
import "react-toastify/dist/ReactToastify.css";

import BackgroundMusic from "@/components/BackgroundMusic";
import Navbar from "@/components/NavBar";
import React from "react";
import RecoilProvider from "@/providers/RecoilProvider";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hiddenNavPaths: string[] = ["/", "/user/login", "/register", "/some-other-page"];

  return (
    <html lang="ko">
      <head>
        {/* PWA 관련 태그 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon/icon-180.png" />

        {/* GA4 gtag.js 스크립트 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-WN3Z4434D2" strategy="afterInteractive" />
        <Script id="ga-setup" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WN3Z4434D2');
          `}
        </Script>
      </head>
      <body className="w-full min-h-screen sm:overflow-auto custom-scrollbar">
        <div className="relative w-full min-h-screen overflow-x-hidden">
          <RecoilProvider>
            <BackgroundMusic />
            {!hiddenNavPaths.includes(pathname) && <Navbar />}
            <div className="w-full min-h-screen">{children}</div>
          </RecoilProvider>
        </div>
        <ToastContainer
          className="!z-[9999]"
          position="top-right" // 알림 위치 설정
          autoClose={3000} // 자동 닫힘 시간 (ms)
          hideProgressBar={false} // 진행바 숨김 여부
          newestOnTop={false} // 최신 알림을 위에 표시할지 여부
          closeOnClick // 클릭 시 닫기
          rtl={false} // RTL 모드 여부
          pauseOnFocusLoss // 포커스 잃었을 때 일시정지
          draggable // 드래그 가능 여부
          pauseOnHover // 마우스 올렸을 때 일시정지
          theme="colored" // 테마 (light, dark, colored)
          toastClassName="custom-toast"
          progressClassName="custom-toast-progress"
        />
      </body>
    </html>
  );
}
