"use client";

import MyFishCollection from "./MyFishCollection";
import TankFishCollection from "./TankFishCollection";
import BackgroundList from "./BackgroundList";

interface FishTankTabContentProps {
  tabName: string;
}

export default function FishTankTabContent({ tabName }: FishTankTabContentProps) {
  return (
    /**
     * 부모 컨테이너: 세로 방향으로 2개 영역을 만듦
     *  1) 상단: MyFishCollection / TankFishCollection 를 가로로 배치
     *  2) 하단: 남은 공간 전체를 BackgroundList가 차지
     */
    <div className="w-full h-full flex flex-col m-0 p-0">
      {/* 상단 영역 (MyFishCollection + TankFishCollection) */}
      <div className="h-3/5 flex gap-2">
        {/* 왼쪽: MyFishCollection */}
        <div
          className="
          flex-1
          w-full h-full m-0 p-5
          flex flex-col items-center
        "
        >
          <p
            className="
            m-1 p-1
            min-w-[200px] h-[50px] px-2
            flex items-center justify-center
            self-start
            rounded-xl border border-[#040303] bg-white 
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
            text-[#070707] text-center font-[400] text-xl
            font-[NeoDunggeunmo_Pro]
          "
          >
            내 물고기
          </p>
          <MyFishCollection />
        </div>
        {/* 오른쪽: TankFishCollection */}
        <div
          className="
          flex-1
          w-full h-full m-0 p-5
          flex flex-col items-center
        "
        >
          <p
            className="
            m-1 p-1
            self-start
            min-w-[200px] h-[50px] px-2
            flex items-center justify-center
            rounded-xl border border-[#040303] bg-white 
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
            text-[#070707] text-center font-[400] text-xl
            font-[NeoDunggeunmo_Pro]
          "
          >
            어항1 물고기
          </p>
          <TankFishCollection tankName={tabName} />
        </div>
      </div>

      {/* 하단 영역 (배경화면) */}
      <div
        className="
          flex-1
          h-full
          w-full m-0 p-5 fl
          flex flex-col items-center
        "
      >
        <p
          className="
            mb-1 p-1
            self-start
            flex items-center justify-center
            min-w-[200px] h-[50px] px-2
            rounded-xl border border-[#040303] bg-white 
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
            text-[#070707] text-center font-[400] text-xl
            font-[NeoDunggeunmo_Pro]
          "
        >
          어항 배경 선택
        </p>
        <BackgroundList />
      </div>
    </div>
  );
}
