"use client";

import { useState, useEffect, useCallback } from "react";
import CollectionItemCard from "./CollectionItemCard";
import axiosInstance from "@/services/axiosInstance";

interface AggregatedFishData {
  fishName: string;
  cnt: number;
  fishIds: number[];
  imageSrc: string;
}

interface AquariumDetails {
  id: number;
  aquariumName: string;
  fishes: AggregatedFishData[];
}

interface TankFishCollectionProps {
  aquariumId: number;
  refresh: number;
  onFishRemoved?: () => void;
  onCountChange?: (count: number) => void; // 부모로 총 마릿수를 전달하는 prop
}

export default function TankFishCollection({ aquariumId, refresh, onFishRemoved, onCountChange }: TankFishCollectionProps) {
  const [aquariumDetails, setAquariumDetails] = useState<AquariumDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  const [selectedFish, setSelectedFish] = useState<AggregatedFishData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchData = useCallback(() => {
    if (!aquariumId) return;
    // 초기 로딩일 때(refresh가 0일 때)만 loading 상태를 true로 설정합니다.
    if (refresh === 0) {
      setLoading(true);
    }
    axiosInstance
      .get(`/aquariums/fish/${aquariumId}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
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
          const details: AquariumDetails = {
            id: aquariumId,
            aquariumName: `어항 ${aquariumId}`,
            fishes: Object.values(grouped),
          };
          setAquariumDetails(details);
          // 총 물고기 마릿수 계산
          const totalFish = details.fishes.reduce((sum, group) => sum + group.cnt, 0);
          if (onCountChange) {
            onCountChange(totalFish);
          }
        } else {
          setAquariumDetails({
            id: aquariumId,
            aquariumName: `어항 ${aquariumId}`,
            fishes: [],
          });
          if (onCountChange) {
            onCountChange(0);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching aquarium details:", err);
        setError("어항 정보를 불러오는 데 실패했습니다.");
      })
      .finally(() => {
        // 초기 로딩일 때만 loading 상태를 false로 전환합니다.
        if (refresh === 0) {
          setLoading(false);
        }
      });
  }, [aquariumId, refresh, onCountChange]);

  useEffect(() => {
    fetchData();
  }, [aquariumId, refresh, fetchData]);

  const handleFishClick = (fishGroup: AggregatedFishData) => {
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
    // Optimistic update: 바로 로컬 상태 업데이트
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
    try {
      await axiosInstance.post("/aquariums/fish/remove", {
        userFishId: fishIdToDelete,
        aquariumId: aquariumId,
      });
      if (onFishRemoved) onFishRemoved();
    } catch (error) {
      console.error("Error removing fish from aquarium:", error);
      // 필요한 경우 optimistic update 복구 로직 추가 가능
    }
  };

  // 렌더링 시: 기존 데이터가 있는 경우 loading 상태여도 기존 데이터를 그대로 보여줍니다.
  if (error) return <div>{error}</div>;
  if (!aquariumDetails && loading) return <div>로딩중...</div>;
  if (!aquariumDetails || aquariumDetails.fishes.length === 0)
    return <div>어항에 물고기가 없습니다.</div>;

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {aquariumDetails.fishes.map((group) => (
          <div
            key={group.fishName}
            onClick={() => handleFishClick(group)}
            className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 cursor-pointer"
          >
            <CollectionItemCard
              name={group.fishName}
              count={group.cnt}
              imageSrc={group.imageSrc}
            />
          </div>
        ))}
      </div>

      {isModalOpen && selectedFish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3">
            <p className="mb-4 text-lg">
              <span className="font-bold">{selectedFish.fishName}</span>를 어항밖으로 빼시겠습니까?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleModalCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
              >
                취소
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
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
