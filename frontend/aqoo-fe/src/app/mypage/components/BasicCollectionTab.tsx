"use client";

import CollectionItemCard from "./CollectionItemCard";

interface BasicCollectionTabProps {
  allFishList: { id: number; fishName: string; imageUrl: string; rarity: string }[];
  userFishList: { fishTypeId: number; fishTypeName: string; fishImage: string; cnt: number }[];
}

export default function BasicCollectionTab({ allFishList = [], userFishList = [] }: BasicCollectionTabProps) {
  const API_BASE_URL = "https://i12e203.p.ssafy.io/";
  return (
    <div id="one-panel" className="flex flex-wrap">
      {allFishList.map((fish, index) => {
        // userFishList에서 해당 fishName과 일치하는 물고기 찾기
        const userFish = userFishList.find((userFish) => userFish.fishTypeName === fish.fishName);

        const imageSrc = userFish ? userFish.fishImage :API_BASE_URL + 'images/bg1.png';
        console.log(imageSrc)
        const name = userFish ? userFish.fishTypeName : fish.fishName;
        const count = userFish ? userFish.cnt : 0;

        return <CollectionItemCard key={fish.id} imageSrc={imageSrc} name={name} count={count} />;
      })}
    </div>
  );
}
