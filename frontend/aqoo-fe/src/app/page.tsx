"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { auth } = useAuth(); // Recoil에서 로그인 상태 가져오기

  return (
    <main className="relative w-full h-screen  flex items-center justify-center">
      <title>AQoO</title>
      {/* 배경 이미지 + 투명 레이어 */}
      <div
        className="absolute inset-0 bg-cover bg-center before:absolute before:inset-0 before:bg-white/30"
        style={{ backgroundImage: "url(/background-1.png)" }}
      ></div>

      <div className="relative text-center">
        <h1 className="text-9xl text-white tracking-widest ">AQoO</h1>
        <Link href={auth.isAuthenticated ? "/main" : "/user/login"}>
          <p className="mt-16 text-4xl text-white hover:text-yellow-300 animate-bounce">start...</p>
        </Link>
      </div>
    </main>
  );
}
