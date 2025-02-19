// app/layout.tsx
"use client";

import Script from "next/script";
import "@/styles/globals.css";
import BackgroundMusic from "@/components/BackgroundMusic";
import Navbar from "@/components/NavBar";
import RecoilProvider from "@/providers/RecoilProvider";
import { usePathname } from "next/navigation";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hiddenNavPaths: string[] = [
    "/",
    "/user/login",
    "/register",
    "/some-other-page",
  ];

  return (
    <html lang="ko">
      <head>
        {/* PWA 관련 태그 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon/icon-180.png" />

        {/* GA4 gtag.js 스크립트 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WN3Z4434D2"
          strategy="afterInteractive"
        />
        <Script id="ga-setup" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WN3Z4434D2');
          `}
        </Script>
      </head>
      <body className="w-full min-h-screen sm:overflow-auto">
        <div className="relative w-full min-h-screen overflow-x-hidden">
          <RecoilProvider>
            <BackgroundMusic />
            {!hiddenNavPaths.includes(pathname) && <Navbar />}
            <div className="w-full min-h-screen">{children}</div>
          </RecoilProvider>
        </div>
      </body>
    </html>
  );
}
