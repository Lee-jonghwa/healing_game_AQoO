"use client";

import { Settings, X } from "lucide-react";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bgMusicVolume, setBgMusicVolume] = useState(50); // 배경음악 기본값 50
  const [sfxVolume, setSfxVolume] = useState(50); // 효과음 기본값 50
  const { auth, logout } = useAuth();
  const router = useRouter();

  // ✅ 로그아웃 함수
  const handleLogout = async () => {
    try {
      await logout(); // Recoil 상태 초기화 & API 호출 <<< 이거 지금 안 되는 게 로컬이어서 그런 건지 아닌지 모르겠어서 수정 바람
      router.push("/user/login"); // 로그아웃 후 로그인 페이지로 이동
    } catch (error) {
      console.error("로그아웃 실패", error);
    }
  };

  return (
    <>
      <nav className="absolute top-4 left-4 z-10 flex justify-between w-full px-10">
        {/* 🏠 로고 */}
        <Link href={auth.isAuthenticated ? "/main" : "/"}>
          <span className="text-white text-5xl hover:text-yellow-300">AQoO</span>
        </Link>

        {/* ⚙️ 설정 버튼 */}
        <button className="p-2 bg-white/30 rounded-full hover:bg-white/50" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-6 h-6 text-white" />
        </button>
      </nav>

      {/* 🎛️ 설정 모달 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">설정</h2>
              <button onClick={() => setIsSettingsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 배경음악 조절 */}
            <div className="mb-4">
              <label className="block text-sm font-medium">배경음악</label>
              <input
                type="range"
                min="0"
                max="100"
                value={bgMusicVolume}
                onChange={(e) => setBgMusicVolume(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm">{bgMusicVolume}%</span>
            </div>

            {/* 효과음 조절 */}
            <div className="mb-4">
              <label className="block text-sm font-medium">효과음</label>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm">{sfxVolume}%</span>
            </div>

            {/* 로그아웃 버튼 */}
            <button className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </>
  );
}
