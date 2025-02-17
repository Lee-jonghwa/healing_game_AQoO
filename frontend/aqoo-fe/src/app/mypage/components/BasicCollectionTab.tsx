"use client";

import { useEffect, useRef, useState } from "react";
import CollectionItemCard from "./CollectionItemCard";

interface BasicCollectionTabProps {
  allFishList: { id: number; fishName: string; imageUrl: string; rarity: string }[];
  userFishList: { fishTypeId: number; fishTypeName: string; fishImage: string; rarity: string; cnt: number }[];
}

export default function BasicCollectionTab({ allFishList = [], userFishList = [] }: BasicCollectionTabProps) {
  const API_BASE_URL = "https://i12e203.p.ssafy.io/";
  const [paddingBottom, setPaddingBottom] = useState(0);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setPaddingBottom(50); // 마지막 아이템이 잘려서 안 보이면 여백 추가
        } else {
          setPaddingBottom(0); // 정상적으로 보이면 여백 제거
        }
      },
      { root: null, threshold: 0.1 }
    );

    if (lastItemRef.current) observer.observe(lastItemRef.current);

    return () => observer.disconnect();
  }, [allFishList]);

  // 원본 배열을 변경하지 않으려면 slice()로 복사 후 정렬
  const sortedFishList = allFishList.slice().sort((a, b) => {
    const aOwned = userFishList.some((userFish) => userFish.fishTypeName === a.fishName);
    const bOwned = userFishList.some((userFish) => userFish.fishTypeName === b.fishName);

    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    return 0;
  });

  return (
    <div
      id="one-panel"
      className="
      w-full h-screen gap-3
      pl-1 pr-1
      grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
      flex flex-wrap
      overflow-y-scroll max-h-[520px]
      scrollbar-none
      "
      style={{
        msOverflowStyle: "none", // IE, Edge에서 스크롤바 숨기기
        scrollbarWidth: "none", // Firefox에서 스크롤바 숨기기
      }}
    >
      {sortedFishList.map((fish) => {
        // userFishList에서 해당 fishName과 일치하는 물고기 찾기
        const userFish = userFishList.find((userFish) => userFish.fishTypeName === fish.fishName);

        const imageSrc = userFish ? userFish.fishImage : `${API_BASE_URL}/images/미등록이미지.png`;
        const name = userFish ? userFish.fishTypeName : fish.fishName;
        const count = userFish ? userFish.cnt : 0;
        const rarity = userFish ? userFish.rarity : fish.rarity;

        return <CollectionItemCard key={fish.id} imageSrc={imageSrc} name={name} rarity={rarity} count={count} />;
      })}
    </div>
  );
}
