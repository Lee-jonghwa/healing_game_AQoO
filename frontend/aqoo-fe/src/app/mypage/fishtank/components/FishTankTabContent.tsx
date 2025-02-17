"use client";

import MyFishCollection from "./MyFishCollection";
import TankFishCollection from "./TankFishCollection";
import BackgroundList from "./BackgroundList";
import { Suspense } from "react";
import { useState } from "react";

interface FishTankTabContentProps {
  aquariumId: number;
  aquariumName: string;
  refreshMyFish: number;
  refreshTankFish: number;
  onFishAdded: () => void;
  onFishRemoved: () => void;
  onSetMainAquarium: () => void;
  onBackgroundChange: (newBackground: string) => void;
}

export default function FishTankTabContent({
  aquariumId,
  aquariumName,
  refreshMyFish,
  refreshTankFish,
  onFishAdded,
  onFishRemoved,
  onSetMainAquarium,
  onBackgroundChange,
}: FishTankTabContentProps) {
  // 상태로 현재 내 물고기 수와 어항의 물고기 수를 저장합니다.
  const [myFishCount, setMyFishCount] = useState(0);
  const [tankFishCount, setTankFishCount] = useState(0);

  return (
    <div className="w-full h-full flex flex-col m-0 p-0">
      <div className="flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        <div className="flex-1 bg-gray-50 rounded-xl shadow p-4">
          <p className="text-xl font-[NeoDunggeunmo_Pro] text-[#070707] mb-2">내 물고기</p>
          <MyFishCollection
            aquariumId={aquariumId}
            aquariumName={aquariumName}
            refresh={refreshMyFish}
            onFishAdded={onFishAdded}
          />
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl shadow p-4">
          <p className="flex items-center justify-between text-xl font-[NeoDunggeunmo_Pro] text-[#070707] mb-2">
            <span>
              {aquariumName} 어항의 물고기 ({tankFishCount}/40)
            </span>
            <button
              onClick={onSetMainAquarium}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              대표어항설정
            </button>
          </p>
          <TankFishCollection
            aquariumId={aquariumId}
            refresh={refreshTankFish}
            onFishRemoved={onFishRemoved}
            onCountChange={(count: number) => setTankFishCount(count)}
          />
        </div>
      </div>

      <div className="mt-6 mb-6 bg-gray-50 rounded-xl shadow p-6 w-[97%] mx-auto">
        <p className="mb-4 text-xl font-[NeoDunggeunmo_Pro] text-[#070707]">어항 배경 선택</p>
        <Suspense fallback={<div>Loading Backgrounds...</div>}>
          <BackgroundList aquariumId={aquariumId} onBackgroundChange={onBackgroundChange} />
        </Suspense>
      </div>
    </div>
  );
}
