"use client";

import { useState, useEffect } from "react";
import CollectionItemCard from "./CollectionItemCard";
import axiosInstance from "@/services/axiosInstance"; // baseURL: http://i12e203.p.ssafy.io:8089/api/v1

// 그룹화된 물고기 정보 타입
interface AggregatedFishData {
  fishName: string;
  cnt: number;
  fishIds: number[]; // 해당 그룹에 속한 개별 물고기의 fishId 목록
  imageSrc: string;
}

// 어항 상세 정보 타입 (어항 이름은 임의로 생성)
interface AquariumDetails {
  id: number;
  aquariumName: string;
  fishes: AggregatedFishData[];
}

interface TankFishCollectionProps {
  aquariumId: number;
  refresh: number; // 부모로부터 받은 리프레시 트리거
  onFishRemoved?: () => void;
}

export default function TankFishCollection({ aquariumId, refresh, onFishRemoved }: TankFishCollectionProps) {
  const [aquariumDetails, setAquariumDetails] = useState<AquariumDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 모달 관련 상태 (제거할 물고기 그룹 선택)
  const [selectedFish, setSelectedFish] = useState<AggregatedFishData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!aquariumId) return;
    setLoading(true);
    axiosInstance
      .get(`/aquariums/fish/${aquariumId}`)
      .then((response) => {
        // console.log("TankFishCollection 받은 데이터 : ", response.data);
        if (Array.isArray(response.data)) {
          // fishName 기준으로 그룹화
          const grouped: { [key: string]: AggregatedFishData } = {};
          response.data.forEach((fish: any) => {
            const name: string = fish.fishName;
            if (grouped[name]) {
              grouped[name].cnt += 1;
              grouped[name].fishIds.push(fish.fishId);
            } else {
              grouped[name] = {
                fishName: name,
                cnt: 1,
                fishIds: [fish.fishId],
                imageSrc: `https://i12e203.p.ssafy.io/images/${name}.png`,
              };
            }
          });
          const aggregatedFishes = Object.values(grouped);
          setAquariumDetails({
            id: aquariumId,
            aquariumName: `어항 ${aquariumId}`,
            fishes: aggregatedFishes,
          });
        } else {
          setAquariumDetails({
            id: aquariumId,
            aquariumName: `어항 ${aquariumId}`,
            fishes: [],
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching aquarium details:", err);
        setError("어항 정보를 불러오는 데 실패했습니다.");
        setLoading(false);
      });
  }, [aquariumId, refresh]);

  // 카드 클릭 시 모달 오픈
  const handleFishClick = (fishGroup: AggregatedFishData) => {
    // console.log("선택된 물고기 그룹:", fishGroup.fishName);
    setSelectedFish(fishGroup);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedFish(null);
  };

  const handleModalConfirm = async () => {
    if (!selectedFish) return;
    const fishIdToDelete = selectedFish.fishIds[0];
    try {
      await axiosInstance.post("/aquariums/fish/remove", {
        userFishId: fishIdToDelete,
        aquariumId: aquariumId,
      });
      setAquariumDetails((prev) => {
        if (!prev) return prev;
        const updatedFishes = prev.fishes
          .map((group) => {
            if (group.fishName === selectedFish.fishName) {
              if (group.cnt > 1) {
                return {
                  ...group,
                  cnt: group.cnt - 1,
                  fishIds: group.fishIds.slice(1),
                };
              } else {
                return null;
              }
            }
            return group;
          })
          .filter((group): group is AggregatedFishData => group !== null);
        return { ...prev, fishes: updatedFishes };
      });
      setIsModalOpen(false);
      setSelectedFish(null);
      if (onFishRemoved) onFishRemoved();
    } catch (error) {
      console.error("Error removing fish from aquarium:", error);
    }
  };

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>{error}</div>;
  if (!aquariumDetails || aquariumDetails.fishes.length === 0)
    return <div>어항에 물고기가 없습니다.</div>;

  return (
    <div className="bg-white w-full h-full rounded-[30px] p-3 overflow-auto">
      <div className="flex flex-wrap">
        {aquariumDetails.fishes.map((group) => (
          <div key={group.fishName} onClick={() => handleFishClick(group)}>
            <CollectionItemCard
              name={group.fishName}
              count={group.cnt}
              imageSrc={group.imageSrc}
            />
          </div>
        ))}
      </div>

      {/* 모달 창 (물고기 제거 확인) */}
      {isModalOpen && selectedFish && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4 text-lg">
              <span className="font-bold">{selectedFish.fishName}</span>를 어항밖으로 빼시겠습니까?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleModalCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                빼기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
