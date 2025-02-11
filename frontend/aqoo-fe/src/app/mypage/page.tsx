"use client";

import LeftButtons from "./components/LeftButtons";
import MyCollection from "./components/MyCollection";
import Profile from "./components/Profile";

import { useUserFishCollectionTest } from "@/hooks/useUserFishCollection";
import { useAllFishCollectionTest } from "@/hooks/useAllFishCollection";
import { useCustomFishCollectionTest } from "@/hooks/useCustomFishCollection";

export default function MyPage() {
  const { fishList: userFishList } = useUserFishCollectionTest();
  const { fishList: allFishList } = useAllFishCollectionTest();
  const { fishList: customFishList } = useCustomFishCollectionTest();

  return (
    <div
      className="
        flex 
        h-screen 
        bg-[url('/images/배경샘플.png')] 
        bg-cover bg-center bg-no-repeat
      "
    >
      {/* 왼쪽 상단 버튼 */}
      <LeftButtons />
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
