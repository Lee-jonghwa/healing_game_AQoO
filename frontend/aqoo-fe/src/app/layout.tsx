// app/layout.tsx
"use client"; // 클라이언트 컴포넌트 설정

import "@/styles/globals.css"; // Tailwind를 적용하려면 반드시 추가해야 함!

import Navbar from "@/components/NavBar";
import RecoilProvider from "@/providers/RecoilProvider";
import { usePathname } from "next/navigation";

// import NavBar from "@/components/NavBar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ✅ 네비게이션을 숨기고 싶은 페이지 리스트
  const hiddenNavPaths = ["/", "/user/login", "/register", "/some-other-page","/mypage","/mypage/fishtank"]; // 네비게이션 숨길 경로

  return (
    <html lang="ko">
      <body className="w-full h-screen overflow-hidden">
        <RecoilProvider>
          {/* ✅ 특정 페이지에서만 네비게이션을 렌더링 */}
          {!hiddenNavPaths.includes(pathname) && <Navbar />}
          <div className="w-full h-full">{children}</div>{" "}
        </RecoilProvider>
      </body>
    </html>
  );
}
