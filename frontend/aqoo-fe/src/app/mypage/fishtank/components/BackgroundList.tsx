"use client";

import { useState } from "react";
import BackgroundItemCard from "./BackgroundItemCard";

export default function BackgroundList() {
  // 현재 선택된 배경화면
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<number | null>(1);
  // 현재 hover된 배경화면
  const [hoveredBackgroundId, setHoveredBackgroundId] = useState<number | null>(null);

  // 배경화면 목록 예시
  const backgroundList = [
    { id: 1, name: "해변 배경", imageSrc: "/images/배경샘플.png" },
    { id: 2, name: "밤하늘 배경", imageSrc: "/images/배경샘플.png" },
    { id: 3, name: "정글 배경", imageSrc: "/images/배경샘플.png" },
    { id: 4, name: "정글 배경", imageSrc: "/images/배경샘플.png" },
  ];

  return (
    // bg-blue + border 없음
    <div className="bg-white w-full h-full rounded-[30px] p-2 overflow-auto">
      <div className="flex flex-wrap justify-center align-center">
        {backgroundList.map((bg) => (
          <BackgroundItemCard
            key={bg.id}
            name={bg.name}
            imageSrc={bg.imageSrc}
            isSelected={bg.id === selectedBackgroundId}
            isHovered={hoveredBackgroundId === bg.id}
            onMouseEnter={() => setHoveredBackgroundId(bg.id)}
            onMouseLeave={() => setHoveredBackgroundId(null)}
            onClick={() => setSelectedBackgroundId(bg.id)}
          />
        ))}
      </div>
    </div>
  );
}
