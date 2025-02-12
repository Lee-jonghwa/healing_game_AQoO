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
        className="absolute top-2 left-2 min-w-[80px] h-10 px-2 rounded-xl border border-[#040303] bg-white
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset] flex items-center justify-center text-[#070707] text-center
          font-[400] text-2xl leading-none font-[NeoDunggeunmo_Pro]"
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

      {/* 메인 컨테이너 (내 정보 & 도감) */}
      <div className="flex flex-col items-center flex-1 h-full overflow-hidden">
        <Profile fishTotal={totalFishCount} />
        <MyCollection allFishList={allFishList} userFishList={userFishList} customFishList={customFishList} />
      </div>
    </div>
  );
}
