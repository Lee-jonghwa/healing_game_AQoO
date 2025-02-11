"use client";

import MyCollection from "./components/MyCollection";
import Profile from "./components/Profile";

import { useUserFishCollectionTest } from "@/hooks/useUserFishCollection";
import { useAllFishCollectionTest } from "@/hooks/useAllFishCollection";
import { useCustomFishCollectionTest } from "@/hooks/useCustomFishCollection";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const { fishList: userFishList } = useUserFishCollectionTest();
  const { fishList: allFishList } = useAllFishCollectionTest();
  const { fishList: customFishList } = useCustomFishCollectionTest();

  // 로그아웃 기능 핸들
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout Failed:", error);
    }
  };

  return (
    <div
      className="
        flex 
        h-screen 
        bg-[url('/images/배경샘플.png')] 
        bg-cover bg-center bg-no-repeat
        relative
      "
    >
      {/* 왼쪽 상단 버튼 */}
      <Link
        href="/main"
        className="absolute top-2 left-2 min-w-[80px] h-10 px-2 rounded-xl border border-[#040303] bg-white
        [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset] flex items-center justify-center text-[#070707] text-center
        font-[400] text-2xl leading-none font-[NeoDunggeunmo_Pro] "
      >
        Home
      </Link>
      <button
        onClick={handleLogout}
        className="
        absolute bottom-2 left-2
          min-w-[80px] h-10 px-2 mt-2
          rounded-xl border border-[#040303] bg-white 
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          flex items-center justify-center
          text-[#070707] text-center font-[400] text-2xl leading-none
          font-[NeoDunggeunmo_Pro]
        "
      >
        Logout
      </button>

      {/* 메인 컨테이너 (내 정보 도감) */}
      <div
        className="flex flex-col items-center flex-1
          h-full
          overflow-hidden"
      >
        <Profile />
        <MyCollection allFishList={allFishList} userFishList={userFishList} customFishList={customFishList} />
      </div>
    </div>
  );
}
