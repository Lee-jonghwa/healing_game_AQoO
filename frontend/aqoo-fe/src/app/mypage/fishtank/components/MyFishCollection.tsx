"use client";

import { useState, useEffect } from "react";
import CollectionItemCard from "./CollectionItemCard";
import axiosInstance from "@/services/axiosInstance";
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";

// 내 물고기 정보 타입 (API 응답에서 fishId, fishName, fishImage 사용)
interface MyFish {
  id: number;         // API의 fishId
  name: string;       // API의 fishName
  count: number;
  imageSrc: string;   // API의 fishImage
}

interface MyFishCollectionProps {
  aquariumId: number;
  aquariumName: string;
  refresh: number;  // 새로고침 트리거
  onFishAdded?: () => void; // 어항에 물고기 추가 후 부모에게 알리는 콜백
}

export default function MyFishCollection({ aquariumId, aquariumName, refresh, onFishAdded }: MyFishCollectionProps) {
  const auth = useRecoilValue(authAtom);
  const [myFishList, setMyFishList] = useState<MyFish[]>([]);
  const [selectedFish, setSelectedFish] = useState<MyFish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (auth.user?.id) {
      axiosInstance
        .get(`aquariums/fish/-1`)
        .then((response) => {
          const fishes: MyFish[] = response.data.map((item: any) => ({
            id: item.fishId,
            name: item.fishName,
            count: 1,
            imageSrc: item.fishImage,
          }));
          setMyFishList(fishes);
        })
        .catch((error) => {
          console.error("Error fetching my fish collection:", error);
        });
    }
  }, [auth.user?.id, refresh]);

  const handleFishClick = (fish: MyFish) => {
    setSelectedFish(fish);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedFish(null);
  };

  const handleModalConfirm = async () => {
    if (!selectedFish) return;
    try {
      await axiosInstance.post("/aquariums/fish/add", {
        userFishId: selectedFish.id,
        aquariumId: aquariumId,
      });
      setMyFishList((prevList) => prevList.filter((fish) => fish.id !== selectedFish.id));
      setIsModalOpen(false);
      setSelectedFish(null);
      // 어항에 추가되었으므로 부모에게 알림 (TankFishCollection 새로고침)
      if (onFishAdded) onFishAdded();
    } catch (error) {
      console.error("Error adding fish to aquarium:", error);
    }
  };

  return (
    <div className="bg-white w-full h-full rounded-[30px] p-3 overflow-auto">
      <div className="flex flex-wrap">
        {myFishList.map((fish) => (
          <div key={fish.id} onClick={() => handleFishClick(fish)}>
            <CollectionItemCard
              name={fish.name}
              count={fish.count}
              imageSrc={fish.imageSrc}
            />
          </div>
        ))}
      </div>

      {/* 모달 창 (물고기 추가 확인) */}
      {isModalOpen && selectedFish && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="mb-4 text-lg">
              활성화 돼있는 <span className="font-bold">{aquariumName}</span> 어항에{" "}
              <span className="font-bold">{selectedFish.name}</span>을(를) 넣겠습니까?
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
                넣기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
