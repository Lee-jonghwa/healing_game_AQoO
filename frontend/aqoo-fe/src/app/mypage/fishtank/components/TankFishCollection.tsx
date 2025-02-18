"use client";

import { useCallback, useEffect, useState } from "react";

import CollectionItemCard from "./CollectionItemCard";
import axiosInstance from "@/services/axiosInstance";
import {useSFX} from "@/hooks/useSFX"

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
  onCountChange?: (count: number) => void;
}

export default function TankFishCollection({
  aquariumId,
  refresh,
  onFishRemoved,
  onCountChange,
}: TankFishCollectionProps) {
  const [aquariumDetails, setAquariumDetails] = useState<AquariumDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [selectedFish, setSelectedFish] = useState<AggregatedFishData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const {play : fishClick } = useSFX("/sounds/버블-01.mp3");
  const fetchData = useCallback(() => {
    if (!aquariumId) return;
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
        if (refresh === 0) {
          setLoading(false);
        }
      });
  }, [aquariumId, refresh, onCountChange]);

  useEffect(() => {
    fetchData();
  }, [aquariumId, refresh, fetchData]);

  const handleFishClick = (fishGroup: AggregatedFishData) => {
    fishClick();
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
      // Optionally, revert optimistic update if needed.
    }
  };

  // 복구된 Enter 키 이벤트: 모달이 열렸을 때 Enter 키를 누르면 handleModalConfirm 실행
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isModalOpen && event.key === "Enter") {
        handleModalConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, selectedFish]);

  if (error) return <div>{error}</div>;
  if (!aquariumDetails && loading) return <div>로딩중...</div>;
  if (!aquariumDetails || aquariumDetails.fishes.length === 0) return <div>어항에 물고기가 없습니다.</div>;

  return (
      <div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap justify-start gap-4 ml-7">
              {aquariumDetails.fishes.map((group) => (
                  <div
                    key={group.fishName}
                    onClick={() => handleFishClick(group)}
                    className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 cursor-pointer m-1"
                  >
                    <CollectionItemCard name={group.fishName} count={group.cnt} imageSrc={group.imageSrc} />
                  </div>
                ))}
              </div>
            </div>

      {isModalOpen && selectedFish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3">
            <p className="mb-4 text-lg">
              <span className="font-bold">{selectedFish.fishName}</span>를 어항밖으로 빼시겠습니까?
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={handleModalCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm">
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
