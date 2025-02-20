"use client";

import { useCallback, useEffect, useState } from "react";

import CollectionItemCard from "./CollectionItemCard";
import { authAtom } from "@/store/authAtom";
import axiosInstance from "@/services/axiosInstance";
import { useRecoilValue } from "recoil";
import { useSFX } from "@/hooks/useSFX";
import { useToast } from "@/hooks/useToast";

interface MyFish {
  fishName: string;
  count: number;
  fishIds: number[];
  imageSrc: string;
}

interface MyFishCollectionProps {
  aquariumId: number;
  aquariumName: string;
  refresh: number;
  onFishAdded?: () => void;
  maxFishCount?: number; // 추가된 부분: 어항 최대 수용 가능 물고기 수
}

export default function MyFishCollection({
  aquariumId,
  aquariumName,
  refresh,
  onFishAdded,
  maxFishCount = 40, // 기본값: 40마리 제한
}: MyFishCollectionProps) {
  const { showToast } = useToast();

  const auth = useRecoilValue(authAtom);
  const [myFishList, setMyFishList] = useState<MyFish[]>([]);
  const [selectedFish, setSelectedFish] = useState<MyFish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentFishCount, setCurrentFishCount] = useState<number>(0); // 어항에 있는 현재 물고기 수
  const { play: fishClick } = useSFX("/sounds/pop-02.mp3");
  const fetchData = useCallback(() => {
    if (auth.user?.id) {
      setLoading(true);
      axiosInstance
        .get(`/aquariums/fish/-1`)
        .then((response) => {
          if (Array.isArray(response.data)) {
            const grouped: { [key: string]: MyFish } = {};
            response.data.forEach((fish: any) => {
              const name: string = fish.fishName;
              if (grouped[name]) {
                grouped[name].count += 1;
                grouped[name].fishIds.push(fish.fishId);
              } else {
                grouped[name] = {
                  fishName: name,
                  count: 1,
                  fishIds: [fish.fishId],
                  imageSrc: fish.fishImage,
                };
              }
            });
            setMyFishList(Object.values(grouped));
          } else {
            setMyFishList([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching my fish collection:", error);
          setLoading(false);
        });
    }
  }, [auth.user]);

  const fetchCurrentFishCount = useCallback(() => {
    axiosInstance
      .get(`/aquariums/fish/${aquariumId}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setCurrentFishCount(response.data.length); // 현재 어항에 있는 물고기 수 설정
        } else {
          setCurrentFishCount(0);
        }
      })
      .catch((error) => {
        console.error("Error fetching current fish count:", error);
      });
  }, [aquariumId]);

  useEffect(() => {
    fetchData();
    fetchCurrentFishCount();
  }, [auth.user?.id, refresh, fetchData, fetchCurrentFishCount]);

  const handleFishClick = (fish: MyFish) => {
    fishClick();

    setSelectedFish(fish);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedFish(null);
  };

  const handleModalConfirm = async () => {
    if (!selectedFish) return;

    // 현재 어항에 있는 물고기가 40마리 이상이면 추가 불가
    if (currentFishCount >= maxFishCount) {
      showToast(`어항에 물고기를 더 추가할 수 없습니다. (최대 ${maxFishCount}마리)`, "warning");
      setIsModalOpen(false);
      setSelectedFish(null);
      return;
    }

    const fishIdToAdd = selectedFish.fishIds[0];
    // Optimistic update: 바로 로컬 상태 업데이트
    setMyFishList((prevList) =>
      prevList
        .map((fish) => {
          if (fish.fishName === selectedFish.fishName) {
            if (fish.count > 1) {
              return {
                ...fish,
                count: fish.count - 1,
                fishIds: fish.fishIds.slice(1),
              };
            } else {
              return null;
            }
          }
          return fish;
        })
        .filter((fish): fish is MyFish => fish !== null)
    );
    setCurrentFishCount((prevCount) => prevCount + 1); // 현재 어항 물고기 수 증가
    setIsModalOpen(false);
    setSelectedFish(null);

    try {
      await axiosInstance.post("/aquariums/fish/add", {
        userFishId: fishIdToAdd,
        aquariumId: aquariumId,
      });
      if (onFishAdded) onFishAdded();
    } catch (error) {
      console.error("Error adding fish to aquarium:", error);
      // 필요 시, optimistic update 복원 로직 추가 가능
    }
  };

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
  }, [isModalOpen, selectedFish, currentFishCount]);

  return (
    <div>
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
        <div className="flex flex-wrap justify-start gap-4 ml-7">
          {myFishList.map((fish) => (
            <div
              key={fish.fishName}
              onClick={() => handleFishClick(fish)}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 cursor-pointer m-1"
            >
              <CollectionItemCard name={fish.fishName} count={fish.count} imageSrc={fish.imageSrc} />
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && selectedFish && (
        <div className=" fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3">
            <p className="mb-4 text-lg">
              <span className="font-bold">{aquariumName}</span> 어항에{" "}
              <span className="font-bold">{selectedFish.fishName}</span>을(를) 넣겠습니까?
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={handleModalCancel} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm">
                취소
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                넣기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
