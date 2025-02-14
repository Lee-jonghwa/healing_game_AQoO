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
  const { auth, logout } = useAuth();
  const router = useRouter();
  const userId = auth?.user?.id;
  const { fishList: userFishList, isLoading: userLoading } = useUserFishCollectionTest(userId);
  const { fishList: allFishList } = useAllFishCollectionTest();
  const { fishList: customFishList, isLoading: customLoading } = useCustomFishCollectionTest(userId);

  // 총 물고기
  const totalFishCount = userFishList.reduce((acc, fish) => acc + fish.cnt, 0) + customFishList.length;

  const API_BASE_URL = "https://i12e203.p.ssafy.io/";

  // 로그아웃 기능 핸들러
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
      style={{ backgroundImage: `url(${API_BASE_URL}/images/bg1.png)` }}
      className={`
        flex
        h-screen
        bg-cover bg-center bg-no-repeat
        relative
      `}
    >
      {/* 왼쪽 상단 Home 버튼 */}
      <Link
        href="/main"
        className="
          absolute top-2 left-2 z-50
          flex items-center justify-center
          min-w-[80px] h-10 px-2
          border border-[#040303] rounded-xl
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          bg-white
          text-[#070707] text-center font-medium text-2xl leading-none
          sm:h-12 sm:text-lg
          md:min-w-[60px] md:h-8 md:text-xl
          lg:min-w-[80px] lg:h-10 lg:text-2xl
        "
      >
        Home
      </Link>
      <button
        onClick={handleLogout}
        className="
          absolute bottom-2 left-2 z-50
          flex items-center justify-center
          min-w-[80px] h-10 px-2
          border border-[#040303] rounded-xl
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          bg-white
          text-[#070707] text-center font-medium text-2xl leading-none
          sm:h-12 sm:text-lg
          md:min-w-[60px] md:h-8 md:text-xl
          lg:min-w-[80px] lg:h-10 lg:text-2xl
        "
      >
        Logout
      </button>

      {/* 메인 컨테이너 (내 정보 & 도감) */}
      <div
        className="
        relative z-10 min-h-screen w-full max-w-8xl mx-auto
        flex flex-col items-center overflow-hidden"
      >
        <Profile fishTotal={totalFishCount} />
        <MyCollection allFishList={allFishList} userFishList={userFishList} customFishList={customFishList} />
      </div>
    </div>
  );
}
