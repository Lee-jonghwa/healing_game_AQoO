"use client";

import { useState, useEffect } from "react";
import BackgroundItemCard from "./BackgroundItemCard";
import axiosInstance from "@/services/axiosInstance"; // 실제 경로에 맞게 조정

// 타입 정의 (필요에 따라 확장 가능)
interface Background {
  id: number;
  name: string;
  imageSrc: string;
}

export default function BackgroundList() {
  // 현재 선택된 배경화면 id (처음에는 첫번째 항목을 기본 선택하도록 초기화할 수도 있음)
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<number | null>(null);
  // 현재 hover된 배경화면 id
  const [hoveredBackgroundId, setHoveredBackgroundId] = useState<number | null>(null);
  // API에서 받아온 배경화면 목록
  const [backgroundList, setBackgroundList] = useState<Background[]>([]);

  useEffect(() => {
    // GET 요청으로 배경화면 목록을 가져옴
    axiosInstance
      .get("/aquariums/backgrounds/all")
      .then((response) => {
        // 응답 데이터 예시:
        // [
        //    { "id": 1, "imageUrl": "https://i12e203.p.ssafy.io/images/bg1.png" },
        //    { "id": 2, "imageUrl": "https://i12e203.p.ssafy.io/images/bg2.png" },
        //    { "id": 3, "imageUrl": "https://i12e203.p.ssafy.io/images/bg3.png" }
        // ]
        const data = response.data;
        const backgrounds: Background[] = data.map((item: { id: number; imageUrl: string }) => ({
          id: item.id,
          // 이름이 없는 경우, 임의의 이름 지정
          name: `Background ${item.id}`,
          imageSrc: item.imageUrl,
        }));
        setBackgroundList(backgrounds);
        // 목록이 있으면 첫번째 항목을 기본 선택
        if (backgrounds.length > 0) {
          setSelectedBackgroundId(backgrounds[0].id);
        }
      })
      .catch((error) => {
        console.error("Error fetching backgrounds:", error);
      });
  }, []);

  return (
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
