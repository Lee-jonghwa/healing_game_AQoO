"use client";

import Link from "next/link";
import FishTankTabs from "./components/FishTankTabs";

export default function MyFishTank() {
  return (
    // 전체 화면 배경 등 기존 MyPage와 비슷한 스타일
    <div
      className="
        flex flex-col
        h-screen
        bg-[url('/images/배경샘플.png')] 
        bg-cover bg-center bg-no-repeat
      "
    >
      {/* 상단 내비게이션 버튼 */}
      <div className="flex flex-col justify-between m-1 absolute top-0 left-0">
        <Link
          href="/mypage"
          className="
             min-w-[80px] h-10 px-2 m-2
             rounded-xl border border-[#040303] bg-white
             [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
             flex items-center justify-center
             text-[#070707] text-center font-[400] text-2xl leading-none
             font-[NeoDunggeunmo_Pro]
          "
        >
          BACK
        </Link>
      </div>
      {/* 메인 컨테이너 */}
      <div
        className="
          flex flex-col items-center
          h-full overflow-hidden
        "
      >
        {/* 실제 탭 + 내용 */}
        <FishTankTabs />
      </div>
    </div>
  );
}
