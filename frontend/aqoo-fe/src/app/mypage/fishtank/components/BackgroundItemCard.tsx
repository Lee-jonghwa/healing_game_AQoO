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
    return src; // 원본 URL 그대로 사용
  };

  return (
    <div
      className={`
        relative w-[250px] h-[150px] mx-2 flex flex-col flex-shrink-0
        items-center justify-center cursor-pointer duration-300 transition-all
        rounded-lg overflow-hidden
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <Image 
        loader={customLoader}
        unoptimized
        src={imageSrc}
        alt={name}
        fill
        className="rounded-lg"
      />
      <div
        className={`
          absolute inset-0 rounded-lg border-[3px] transition-all duration-300 pointer-events-none
          ${isSelected ? "border-yellow-400" : isHovered ? "border-green-400" : "border-transparent"}
        `}
      />
    </div>
  );
}
