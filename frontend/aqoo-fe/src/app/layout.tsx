// app/layout.tsx
"use client"; // 클라이언트 컴포넌트 설정

import "@/styles/globals.css"; // Tailwind를 적용하려면 반드시 추가해야 함!
import Navbar from "@/components/NavBar";
import RecoilProvider from "@/providers/RecoilProvider";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

<<<<<<< HEAD
  // ✅ 네비게이션을 숨기고 싶은 정적 경로 리스트
  const staticHiddenNavPaths = ["/login", "/register", "/some-other-page"];

  // ✅ 동적 경로 숨기기 (예: /room/123/game, /room/abc/game 등)
  const isDynamicRoomGame = pathname.startsWith("/room/") && pathname.endsWith("/game");

  // 네비게이션을 숨길 조건 (정적 경로와 동적 경로 모두 고려)
  const shouldHideNav = staticHiddenNavPaths.includes(pathname) || isDynamicRoomGame;
=======
  // ✅ 네비게이션을 숨기고 싶은 페이지 리스트
  const hiddenNavPaths = ["/", "/user/login", "/register", "/some-other-page"]; // 네비게이션 숨길 경로
>>>>>>> frontend

  return (
    <html lang="ko">
      <body className="w-full h-screen overflow-hidden">
        <RecoilProvider>
<<<<<<< HEAD
          {/* 조건에 맞는 경우에만 네비게이션 렌더링 */}
          {!shouldHideNav && <Navbar />}
          {children}
=======
          {/* ✅ 특정 페이지에서만 네비게이션을 렌더링 */}
          {!hiddenNavPaths.includes(pathname) && <Navbar />}
          <div className="w-full h-full">{children}</div>{" "}
>>>>>>> frontend
        </RecoilProvider>
      </body>
    </html>
  );
}
