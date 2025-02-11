"use client";

import Image from "next/image";

// 공통으로 사용할 아이템 카드 컴포넌트
// name: 아이템 이름 (예: '거북이 1')
// count: 아이템 수량
// imageSrc: 이미지 경로
interface CollectionItemCardProps {
  name: string;
  count: number;
  imageSrc: string;
}

export default function CollectionItemCard({ name, count, imageSrc }: CollectionItemCardProps) {
  return (
    <div
      className="
        flex flex-col m-2
        w-[150px] h-[150px] flex-shrink-0
        items-center justify-center
        rounded-xl border border-black bg-white
        shadow-[1px_1px_0px_1px_rgba(0,0,0,0.5)]
        text-[1.5em] font-bold
      "
    >
      <div
        className="
          w-[130px] h-[130px]
          flex flex-col items-center justify-center
          rounded-xl border border-black bg-white
        "
      >
        <div className="flex-1 flex items-center justify-center">
          <Image src={imageSrc} alt={name} width={130} height={130} style={{ objectFit: "cover" }} />
        </div>
        <div
          className="
          flex items-end gap-2 text-[15px]
          font-[NeoDunggeunmo_Pro] text-black
          mt-auto
        "
        >
          <p>{name}</p>
          <p className="text-[10px] text-gray-500">x {count}</p>
        </div>
      </div>
    </div>
  );
}
