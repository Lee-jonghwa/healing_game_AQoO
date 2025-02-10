"use client";

import LeftButtons from "./components/LeftButtons";
import MyCollection from "./components/MyCollection";
import Profile from "./components/Profile";

import { useUserFishCollectionTest } from "@/hooks/useUserFishCollection";
import { useAllFishCollectionTest } from "@/hooks/useAllFishCollection";
import { useCustomFishCollectionTest } from "@/hooks/useCustomFishCollection";


export default function MyPage() {
  const { fishList: userFishList, isLoading: isUserLoading, error: userError } = useUserFishCollectionTest();
  const { fishList: allFishList, isLoading: isAllLoading, error: allError } = useAllFishCollectionTest();
  const { fishList: customFishList, isLoading: isCustomLoading, error: customError} = useCustomFishCollectionTest()

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
        {/* ✅ 테스트용 물고기 목록 직접 렌더링 */}
        <div className="w-full max-w-4xl mt-8 p-4 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">🐟 물고기 목록 (테스트용)</h2>
          {/* ✅ 유저 물고기 도감 표시 (테스트용) */}
          {isUserLoading ? (
            <p>로딩 중...</p>
          ) : userError ? (
            <p>{userError.message}</p>
          ) : (
            <p>🐟 유저 물고기 수: {userFishList.length}</p>
          )}

          {/* ✅ 전체 물고기 도감 표시 (테스트용) */}
          {isAllLoading ? (
            <p>로딩 중...</p>
          ) : allError ? (
            <p>{allError.message}</p>
          ) : (
            <p>🌊 전체 물고기 종류 수: {allFishList.length}</p>
          )}

        </div>
        <Profile />
        <MyCollection allFishList={allFishList} userFishList={userFishList} customFishList={customFishList}/>
      </div>
    </div>
  );
}
