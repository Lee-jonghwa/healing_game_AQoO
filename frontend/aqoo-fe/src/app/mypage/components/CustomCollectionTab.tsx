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
    <div className="flex flex-wrap">
      {customFishList.map((fish) => (
        <CollectionItemCard key={fish.fishTypeId} imageSrc={fish.fishImage} name={fish.fishTypeName} />
      ))}
    </div>
  );
}
