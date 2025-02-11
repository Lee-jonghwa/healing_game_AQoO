"use client";

import CollectionItemCard from "./CollectionItemCard";

interface BasicCollectionTabProps {
  allFishList: { id: number; fishName: string; imageUrl: string; rarity: string }[];
  userFishList: { fishTypeId: number; fishTypeName: string; fishImage: string; cnt: number }[];
}

export default function BasicCollectionTab({ userFishList = [] }: BasicCollectionTabProps) {
  return (
    <div id="one-panel" className="flex flex-wrap">
      {Array(50)
        .fill(null)
        .map((_, index) => {
          const fish = userFishList[index]; // 현재 index에 해당하는 물고기 가져오기
          const imageSrc = fish ? `${fish.fishImage}` : "/images/배경샘플.png"; // 물고기가 없으면 기본 배경 이미지 사용
          const name = fish ? fish.fishTypeName : `미등록`; // 물고기가 없으면 기본 이름
          const count = fish ? fish.cnt : 0; // 기본 수량 (물고기가 없으면 0)
          return <CollectionItemCard key={index} imageSrc={imageSrc} name={name} count={count} />;
        })}
    </div>
  );
}
