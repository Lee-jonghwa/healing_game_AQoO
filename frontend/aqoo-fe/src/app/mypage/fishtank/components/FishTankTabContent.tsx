"use client";

import MyFishCollection from "./MyFishCollection";
import TankFishCollection from "./TankFishCollection";
import BackgroundList from "./BackgroundList";
import { Suspense } from "react";

interface FishTankTabContentProps {
  aquariumId: number;
  aquariumName: string;
  refreshMyFish: number;
  refreshTankFish: number;
  onFishAdded: () => void;
  onFishRemoved: () => void;
}

export default function FishTankTabContent({
  aquariumId,
  aquariumName,
  refreshMyFish,
  refreshTankFish,
  onFishAdded,
  onFishRemoved,
}: FishTankTabContentProps) {
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
            {aquariumName} 어항의 물고기
          </p>
          <TankFishCollection
            aquariumId={aquariumId}
            refresh={refreshTankFish}
            onFishRemoved={onFishRemoved}
          />
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl shadow p-4">
        <p className="mb-4 text-xl font-[NeoDunggeunmo_Pro] text-[#070707]">어항 배경 선택</p>
        <Suspense fallback={<div>Loading Backgrounds...</div>}>
          <BackgroundList aquariumId={aquariumId} />
        </Suspense>
      </div>
    </div>
  );
}
