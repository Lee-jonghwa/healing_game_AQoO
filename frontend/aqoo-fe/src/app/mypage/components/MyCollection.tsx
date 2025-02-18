"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import BasicCollectionTab from "./BasicCollectionTab";
import CustomCollectionTab from "./CustomCollectionTab";
import { Suspense } from "react";

interface MyCollectionProps {
  allFishList: { id: number; fishName: string; imageUrl: string; rarity: string }[];
  userFishList: { fishTypeId: number; fishTypeName: string; fishImage: string; rarity: string; cnt: number }[];
  customFishList: { fishTypeId: number; fishTypeName: string; fishImage: string }[];
}

function MyCollectionContent({ allFishList, userFishList, customFishList }: MyCollectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedTab = searchParams.get("tab") || "basic";

  const handleTabChange = (tabName: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tabName);
    router.push(`/mypage?${newParams.toString()}`);
  };

  return (
    <div className="relative flex flex-col mt-2 w-full max-w-[1300px] justify-start '">
      {/* 탭 영역 */}
      <div className="flex items-end mb-0 mt-1 gap-1">
        <button
          onClick={() => handleTabChange("basic")}
          className={`
            relative left-[10px] sm:left-[30px] 
            cursor-pointer inline-flex items-center justify-center
            w-1/3 sm:max-w-[180px] md:w-[200px]
            h-7 sm:h-12 px-5 py-2
            rounded-t-xl border-t border-r border-l border-[#1c5e8d]
            bg-[#f0f0f0]
            [box-shadow:-1px_0px_0px_2px_rgba(0,0,0,0.25)_inset]
            text-[#070707] text-base sm:text-xl md:text-2xl
            font-normal leading-normal
            ${selectedTab === "basic" ? "bg-[#31A9FF] text-2xl text-black border-t-[3px] border-black" : ""}
          `}
        >
          도감관리
        </button>
        <button
          onClick={() => handleTabChange("custom")}
          className={`
            relative left-[10px] sm:left-[30px] 
            cursor-pointer inline-flex items-center justify-center
            w-1/3 sm:w-[180px] md:w-[200px]
            h-7 sm:h-12 px-5 py-2
            rounded-t-xl border-t border-r border-l border-[#1c5e8d]
            bg-[#f0f0f0]
            [box-shadow:-1px_0px_0px_2px_rgba(0,0,0,0.25)_inset]
            text-[#070707] text-base sm:text-xl md:text-2xl
            font-normal leading-normal
            ${selectedTab === "custom" ? "bg-[#31A9FF] text-2xl text-black border-t-[3px] border-black" : ""}
          `}
        >
          커스텀
        </button>
      </div>

      {/* 어항관리 버튼 (오른쪽 상단) */}
      <Link href="mypage/fishtank" className="absolute right-0 top-0">
        <button
          className="
            min-w-[30px] sm:min-w-[80px]
            h-7 sm:h-10 px-2 
            rounded-lg sm:rounded-xl border border-[#040303] bg-white 
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
            flex items-center justify-center
            text-[#070707] text-center font-[400] 
            text-base sm:text-xl md:text-2xl
          "
        >
          어항관리
        </button>
      </Link>

      {/* 탭 컨텐츠 영역 */}
      <div
        className="
          w-full max-w-[1300px] m-0 p-2 sm:p-5
          rounded-xl border-2 border-[#1c5e8d] bg-[#31a9ff]
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.25)_inset]
          flex flex-col items-center
          
        "
        style={{
          height: "calc(100vh - 150px)", // 화면 높이에서 탭 버튼과 패딩을 뺀 실제 가용 높이
        }}
      >
        <div
          className="flex-1 min-h-0 overflow-y-auto scrollbar-none bg-white w-full rounded-xl sm:rounded-[30px]"
          style={{
            maxHeight: "100%", // 부모 높이 안에서 꽉 차도록 설정
            scrollPaddingBottom: "50px", // 마지막 요소가 보이도록 여유 공간 추가
            msOverflowStyle: "none", // IE, Edge에서 스크롤바 숨기기
            scrollbarWidth: "none", // Firefox에서 스크롤바 숨기기
          }}
        >
          <div className="bg-white">
            {selectedTab === "basic" && <BasicCollectionTab allFishList={allFishList} userFishList={userFishList} />}
            {selectedTab === "custom" && <CustomCollectionTab customFishList={customFishList} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense 경계로 감싼 MyCollection 컴포넌트
export default function MyCollection({ allFishList, userFishList, customFishList }: MyCollectionProps) {
  return (
    <Suspense fallback={<div>Loading collection...</div>}>
      <MyCollectionContent allFishList={allFishList} userFishList={userFishList} customFishList={customFishList} />
    </Suspense>
  );
}
