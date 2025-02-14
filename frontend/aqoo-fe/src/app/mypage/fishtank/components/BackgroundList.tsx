"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/services/axiosInstance";
import BackgroundItemCard from "./BackgroundItemCard";
import { BADFLAGS } from "dns";

interface Background {
  id: number;
  imageUrl: string;
}

interface BackgroundListProps {
  aquariumId: number;
  onBackgroundChange: (newBackground: string) => void;
}

export default function BackgroundList({ aquariumId, onBackgroundChange }: BackgroundListProps) {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    axiosInstance
      .get("aquariums/backgrounds/all")
      .then((response) => {
        const fetchedBackgrounds: Background[] = response.data;
        setBackgrounds(fetchedBackgrounds);
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

  const handleBackgroundSelect = (backgroundId: number, newBgUrl: string) => {
    setSelectedBackgroundId(backgroundId);
    axiosInstance
      .post("/aquariums/update", {
        aquariumId: aquariumId,
        type: "background",
        data: backgroundId,
      })
      .then(() => {
        onBackgroundChange(newBgUrl);
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
    <div className="h-64 overflow-y-auto">
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
              onClick={() => handleBackgroundSelect(bg.id, bg.imageUrl)}
            />
          );
        })}
      </div>
    </div>
  );
}
