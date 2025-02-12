"use client";

import Link from "next/link";
import FishTankTabs from "./components/FishTankTabs";

export default function MyFishTank() {
  return (
    <div
      className="
        flex flex-col
        h-screen
        bg-[url('https://i12e203.p.ssafy.io/images/bg1.png')]
        bg-cover bg-center bg-no-repeat
      "
    >
      {/* 상단 내비게이션 버튼 */}
      <div className="absolute top-0 left-0 m-2">
        <Link
          href="/mypage"
          className="
            min-w-[80px] h-10 px-2
            rounded-xl border border-[#040303] bg-white
            shadow-inner
            flex items-center justify-center
            text-[#070707] text-center font-normal text-2xl leading-none
            font-[NeoDunggeunmo_Pro]
            sm:min-w-[80px] sm:h-10
            md:min-w-[100px] md:h-12
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
          p-4
          sm:p-6 md:p-8
        "
      >
        {/* 실제 탭 + 내용 */}
        <FishTankTabs />
      </div>
    </div>
  );
}
