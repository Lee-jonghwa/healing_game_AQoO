"use client";

import CollectionItemCard from "./CollectionItemCard";

interface CustomCollectionTapProps {
  customFishList: {
    fishTypeId: number;
    fishTypeName: string;
    fishImage: string;
  }[];
}
// 탭 "커스텀" 화면
export default function CustomCollectionTab({ customFishList }: CustomCollectionTapProps) {
  return (
    <div
      className="
        w-full h-screen gap-3
        pb-[50px] sm:pb-[120px] md:pb-[120px] lg:pb-[120px]
        pl-1 pr-1
        grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
        flex flex-wrap items-start
        overflow-y-scroll max-h-[520px]
        scrollbar-none
      "
    >
      {customFishList.map((fish) => (
        <CollectionItemCard key={fish.fishTypeId} imageSrc={fish.fishImage} name={fish.fishTypeName} />
      ))}
    </div>
  );
}
