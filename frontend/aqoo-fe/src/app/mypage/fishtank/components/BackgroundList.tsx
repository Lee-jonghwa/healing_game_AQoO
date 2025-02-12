"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/services/axiosInstance";
import BackgroundItemCard from "./BackgroundItemCard";

interface Background {
  id: number;
  imageUrl: string;
}

interface BackgroundListProps {
  aquariumId: number;
}

export default function BackgroundList({ aquariumId }: BackgroundListProps) {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // API를 통해 배경화면 전체 목록을 가져옵니다.
  useEffect(() => {
    axiosInstance
      .get("aquariums/backgrounds/all")
      .then((response) => {
        // 응답이 배열 형태이므로 바로 사용합니다.
        const fetchedBackgrounds: Background[] = response.data;
        setBackgrounds(fetchedBackgrounds);
        // 기본 선택은 첫 번째 배경으로 설정 (필요 시 어항의 현재 배경 정보를 사용)
        if (fetchedBackgrounds.length > 0) {
          setSelectedBackgroundId(fetchedBackgrounds[0].id);
        }
      })
      .catch((error) => {
        console.error("Error fetching backgrounds", error);
        setError("배경화면 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 배경 선택 시 호출되는 핸들러
  const handleBackgroundSelect = (backgroundId: number) => {
    setSelectedBackgroundId(backgroundId);
    axiosInstance
      .post("/aquariums/update", {
        aquariumId: aquariumId,
        type: "background",
        data: backgroundId, // 선택한 배경의 id를 전송
      })
      .then(() => {
        alert("배경화면이 변경되었습니다.");
      })
      .catch((error) => {
        console.error("배경 변경 실패", error);
      });
  };

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>{error}</div>;
  if (backgrounds.length === 0) return <div>배경화면이 없습니다.</div>;

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {backgrounds.map((bg, idx) => {
        const isSelected = bg.id === selectedBackgroundId;
        const isHovered = hoveredIndex === idx;
        const imageSrc = bg.imageUrl;
        const name = `Background ${bg.id}`;
        return (
          <BackgroundItemCard
            key={bg.id}
            name={name}
            imageSrc={imageSrc}
            isSelected={isSelected}
            isHovered={isHovered}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => handleBackgroundSelect(bg.id)}
          />
        );
      })}
    </div>
  );
}
