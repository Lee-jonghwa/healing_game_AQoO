"use client";

import { useState, useEffect } from "react";
import BackgroundItemCard from "./BackgroundItemCard";
import axiosInstance from "@/services/axiosInstance"; // 실제 경로에 맞게 조정

// Background 타입 정의
interface Background {
  id: number;
  name: string;
  imageSrc: string;
}

// 부모로부터 어항 id를 전달받기 위한 Props 타입 정의
interface BackgroundListProps {
  aquariumId: number;
}

export default function BackgroundList({ aquariumId }: BackgroundListProps) {
  // 현재 선택된 배경화면 id (초기값: null)
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
        // API 응답 예시:
        // [
        //    { "id": 1, "imageUrl": "https://i12e203.p.ssafy.io/images/bg1.png" },
        //    { "id": 2, "imageUrl": "https://i12e203.p.ssafy.io/images/bg2.png" },
        //    { "id": 3, "imageUrl": "https://i12e203.p.ssafy.io/images/bg3.png" }
        // ]
        const data = response.data;
        // 응답 받은 데이터를 그대로 사용하여 Background 배열 생성
        const backgrounds: Background[] = data.map(
          (item: { id: number; imageUrl: string }) => ({
            id: item.id,
            // 이름이 없으면 기본 이름 부여
            name: `Background ${item.id}`,
            imageSrc: item.imageUrl,
          })
        );
        setBackgroundList(backgrounds);
        // 목록이 있으면 첫 번째 항목을 기본 선택
        if (backgrounds.length > 0) {
          setSelectedBackgroundId(backgrounds[0].id);
        }
      })
      .catch((error) => {
        console.error("Error fetching backgrounds:", error);
      });
  }, []);

  // 배경 클릭 시 처리: 선택된 배경 id를 저장하고 POST 요청으로 배경 업데이트
  const handleBackgroundClick = (bgId: number) => {
    setSelectedBackgroundId(bgId);
    axiosInstance
      .post("/aquariums/update", {
        aquariumId: aquariumId,
        type: "background",
        data: bgId, // API 응답에서 받은 배경 id 사용
      })
      .then((response) => {
        console.log("Background update successful:", response.data);
      })
      .catch((error) => {
        console.error("Error updating background:", error);
      });
  };

  return (
    <div className="bg-white w-full h-full rounded-[30px] p-2 overflow-auto">
      <div className="flex flex-wrap justify-center items-center">
        {backgroundList.map((bg) => (
          <BackgroundItemCard
            key={bg.id}
            name={bg.name}
            imageSrc={bg.imageSrc}
            isSelected={bg.id === selectedBackgroundId}
            isHovered={hoveredBackgroundId === bg.id}
            onMouseEnter={() => setHoveredBackgroundId(bg.id)}
            onMouseLeave={() => setHoveredBackgroundId(null)}
            onClick={() => handleBackgroundClick(bg.id)}
          />
        ))}
      </div>
    </div>
  );
}
