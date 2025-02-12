"use client";

import { useState, useEffect } from "react";
import CollectionItemCard from "./CollectionItemCard";
import axiosInstance from "@/services/axiosInstance";
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";

// 그룹화된 내 물고기 정보 타입
interface MyFish {
  fishName: string;    // API의 fishName
  count: number;       // 같은 물고기의 개수
  fishIds: number[];   // 해당 그룹에 속한 개별 물고기의 fishId 목록
  imageSrc: string;    // API의 fishImage (또는 이미지 URL 생성에 사용할 값)
}

interface MyFishCollectionProps {
  aquariumId: number;
  aquariumName: string;
  refresh: number;             // 부모 컴포넌트로부터 전달받은 새로고침 트리거
  onFishAdded?: () => void;    // 어항에 물고기 추가 후 부모에게 알리는 콜백
}

export default function MyFishCollection({
  aquariumId,
  aquariumName,
  refresh,
  onFishAdded,
}: MyFishCollectionProps) {
  const auth = useRecoilValue(authAtom);
  const [myFishList, setMyFishList] = useState<MyFish[]>([]);
  const [selectedFish, setSelectedFish] = useState<MyFish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (auth.user?.id) {
      axiosInstance
        .get(`aquariums/fish/-1`)
        .then((response) => {
          // API 응답 예시:
          // [
          //   { "aquariumId": 1, "fishId": 9, "fishTypeId": 1, "fishName": "Goldfish", "fishImage": "https://example.com/fish1.png" },
          //   { "aquariumId": 1, "fishId": 10, "fishTypeId": 1, "fishName": "Goldfish", "fishImage": "https://example.com/fish1.png" },
          //   { "aquariumId": 1, "fishId": 11, "fishTypeId": 3, "fishName": "Betta", "fishImage": "https://example.com/fish3.png" }
          // ]
          if (Array.isArray(response.data)) {
            // 그룹화: fishName 기준으로 그룹 생성
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
                  imageSrc: fish.fishImage, // 또는 `https://i12e203.p.ssafy.io/images/${name}.png`
                };
              }
            });
            const aggregatedFishes = Object.values(grouped);
            setMyFishList(aggregatedFishes);
          } else {
            setMyFishList([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching my fish collection:", error);
        });
    }
  }, [auth.user?.id, refresh]);

  // 카드 클릭 시 모달을 열어 어항에 넣을 물고기를 선택
  const handleFishClick = (fish: MyFish) => {
    setSelectedFish(fish);
    setIsModalOpen(true);
  };

  // 모달 취소
  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedFish(null);
  };

  // 모달의 "넣기" 버튼 클릭 시, POST 요청으로 어항에 물고기를 추가
  const handleModalConfirm = async () => {
    if (!selectedFish) return;
    // 그룹 내에서 추가할 물고기의 식별자는 첫 번째 fishId 사용
    const fishIdToAdd = selectedFish.fishIds[0];
    try {
      await axiosInstance.post("/aquariums/fish/add", {
        userFishId: fishIdToAdd,
        aquariumId: aquariumId,
      });
      // 요청 성공 시, 내 물고기 목록 업데이트:
      // 같은 그룹의 개수가 1보다 크면 count 감소 및 fishIds 배열에서 첫 번째 요소 제거,
      // count가 1이면 해당 그룹을 제거
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
          <div key={fish.fishName} onClick={() => handleFishClick(fish)}>
            <CollectionItemCard
              name={fish.fishName}
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
              <span className="font-bold">{selectedFish.fishName}</span>을(를) 넣겠습니까?
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
