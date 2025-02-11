"use client";

import CollectionItemCard from "./CollectionItemCard";

export default function MyFishCollection() {
  // 예시로 5마리 물고기
  const myFishList = [
    { id: 1, name: "거북이 1", count: 2, imageSrc: "/images/대표이미지샘플.png" },
    { id: 2, name: "거북이 2", count: 1, imageSrc: "/images/대표이미지샘플 (2).png" },
    { id: 3, name: "거북이 3", count: 5, imageSrc: "/images/대표이미지샘플 (3).png" },
    { id: 4, name: "거북이 4", count: 2, imageSrc: "/images/대표이미지샘플 (4).png" },
    { id: 5, name: "거북이 5", count: 3, imageSrc: "/images/대표이미지샘플 (5).png" },
  ];

  return (
    // bg-blue, w-full, h-full, rounded-[30px] 적용
    <div className="bg-white w-full h-full rounded-[30px] p-3 overflow-auto">
      <div className="flex flex-wrap">
        {myFishList.map((fish) => (
          <CollectionItemCard key={fish.id} name={fish.name} count={fish.count} imageSrc={fish.imageSrc} />
        ))}
      </div>
    </div>
  );
}
