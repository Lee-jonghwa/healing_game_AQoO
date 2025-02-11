"use client";

import Image from "next/image";

interface BackgroundItemCardProps {
  name: string;
  imageSrc: string;
  isSelected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

// 배경용 카드
export default function BackgroundItemCard({
  name,
  imageSrc,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: BackgroundItemCardProps) {
  const customLoader = ({ src }: { src: string }) => {
    return src; // ✅ 원본 URL 그대로 사용하도록 설정
  };

  return (
    <div
      className={`
        relative w-[250px] h-[150px] mr-4 ml-4 flex flex-col flex-shrink-0
        items-center justify-center cursor-pointer duration-300 transition-all
        rounded-xl overflow-hidden
        `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      
      <Image 
      loader={customLoader} // ✅ 커스텀 로더 추가
      unoptimized
      src={imageSrc} alt={name} fill className="rounded-xl" />
      <div
        className={`
          absolute inset-0 rounded-xl border-[6px] transition-all duration-300 pointer-events-none
          ${isSelected ? "border-yellow-400" : isHovered ? "border-green-400" : "border-transparent"}
        `}
      />
    </div>
  );
}
