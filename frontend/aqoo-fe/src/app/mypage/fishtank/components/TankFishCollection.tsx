"use client";

import { useState, useEffect } from "react";
import CollectionItemCard from "./CollectionItemCard";
import axiosInstance from "@/services/axiosInstance"; // baseURL: http://i12e203.p.ssafy.io:8089/api/v1

// 물고기 정보 타입
interface FishData {
  fish: string;
  cnt: number;
}

// 어항 상세 정보 타입
interface AquariumDetails {
  id: number;
  aquariumName: string;
  fishes: FishData[];
  // 그 외 다른 필드들은 필요 시 추가
}

interface TankFishCollectionProps {
  aquariumId: number;
}

export default function TankFishCollection({ aquariumId }: TankFishCollectionProps) {
  const [aquariumDetails, setAquariumDetails] = useState<AquariumDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!aquariumId) return;
    setLoading(true);
    axiosInstance
      .get(`/aquariums/${aquariumId}`)
      .then((response) => {
        // 응답 예시:
        // {
        //   "id": 2,
        //   "aquariumName": "bowl 2",
        //   ...,
        //   "fishes": [
        //       { "fish": "Yellowtang", "cnt": 1 }
        //   ]
        // }
        setAquariumDetails(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching aquarium details:", err);
        setError("어항 정보를 불러오는 데 실패했습니다.");
        setLoading(false);
      });
  }, [aquariumId]);

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>{error}</div>;
  if (!aquariumDetails) return <div>어항 정보 없음</div>;

  return (
    <div className="bg-white w-full h-full rounded-[30px] p-3 overflow-auto">
      <div className="flex flex-wrap">
        {aquariumDetails.fishes.map((fishData, index) => (
          <CollectionItemCard
            key={index}
            name={fishData.fish}
            count={fishData.cnt}
            imageSrc="/images/대표이미지샘플.png" // 필요 시 API 응답이나 다른 로직으로 이미지 경로 설정
          />
        ))}
      </div>
    </div>
  );
}
