"use client";

import CollectionItemCard from "./CollectionItemCard";

interface TankFishCollectionProps {
  tankName: string;
}

export default function TankFishCollection({ tankName }: TankFishCollectionProps) {
  // 어항의 물고기 목록 예시
  const tankFishList = [
    { id: 1, name: `바다거북이이이`, count: 1, imageSrc: "/images/대표이미지샘플 (4).png" },
    { id: 2, name: `거북이 2`, count: 2, imageSrc: "/images/대표이미지샘플 (5).png" },
  ];

  return (
    // 동일하게 bg-blue w-full h-full rounded-[30px]
    <div className="bg-white w-full h-full rounded-[30px] p-3 overflow-auto">
      <div className="flex flex-wrap">
        {tankFishList.map((fish) => (
          <CollectionItemCard key={fish.id} name={fish.name} count={fish.count} imageSrc={fish.imageSrc} />
        ))}
      </div>
    </div>
  );
}
