"use client";

import { useState, useEffect } from "react";
import CollectionItemCard from "../components/CollectionItemCard";
import Modal from "./Modal";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/services/axiosInstance"; // axiosInstance 임포트

interface FishData {
  fishTypeId: number;
  fishTypeName: string;
  fishImage: string;
}

interface UserData {
  id: string;
  email: string;
  nickname: string;
  mainFishImage: string;
}

interface MyFishChangeModalProps {
  onClose: () => void;
  userData: UserData;
}

export default function MyFishChangeModal({ onClose, userData }: MyFishChangeModalProps) {
  const [selectedFishId, setSelectedFishId] = useState<number | null>(null);
  const [selectedFishImage, setSelectedFishImage] = useState<string | null>(null);
  const [fishList, setFishList] = useState<FishData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { fetchUser } = useAuth();
  // 현재 대표 물고기 정보는 상위에서 받아온 userData.mainFishImage를 사용
  const currentMainFishImage = userData.mainFishImage;

  // 내가 가진 fish 정보를 axiosInstance를 통해 불러오고,
  // 현재 대표 물고기와 동일한 fishImage는 필터링합니다.
  useEffect(() => {
    if (!userData.id) return;
    setIsLoading(true);
    axiosInstance
      .get<FishData[]>(`/fish/my-fish/${userData.id}`)
      .then((response) => {
        const data = response.data;
        const filteredFish = data.filter(
          (fish) => fish.fishImage !== currentMainFishImage
        );
        setFishList(filteredFish);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("내 fish 정보를 불러오는 중 오류 발생:", error);
        setIsLoading(false);
      });
  }, [userData.id, currentMainFishImage]);

  // 완료 버튼 클릭 시 대표 물고기 변경 API 호출
  const handleConfirm = async () => {
    if (!selectedFishImage) {
      alert("대표 물고기를 선택해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      await axiosInstance.post("/users", {
        userId: userData.id,
        userNickName: userData.nickname,
        mainFishImage: selectedFishImage,
      });
      alert("대표 물고기 변경 성공!");
      // 전역 유저 데이터를 새로 불러와 업데이트합니다.
      await fetchUser();
      onClose();
    } catch (error) {
      alert("대표 물고기 변경에 실패했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} className="overflow-y-auto w-[1000px] h-[550px] p-6">
      <h3 className="text-3xl font-semibold mb-4">대표 물고기 수정</h3>
      <div className="flex mb-4">
        <button
          className="px-4 py-2 bg-gray-300 rounded mr-2"
          onClick={onClose}
          disabled={isLoading}
        >
          취소
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          변경완료
        </button>
      </div>
      {isLoading && <p>로딩 중...</p>}
      {!isLoading && (
        <div className="flex justify-end mt-6">
          <div id="one-panel" className="flex flex-wrap">
            {fishList.length > 0 ? (
              fishList.map((fish) => (
                <CollectionItemCard
                  key={fish.fishTypeId}
                  imageSrc={fish.fishImage}
                  name={fish.fishTypeName}
                  // 필요에 따라 count 값을 조정하거나 생략할 수 있음
                  count={1}
                  isModal={true}
                  isSelected={fish.fishTypeId === selectedFishId}
                  onClick={() => {
                    setSelectedFishId(fish.fishTypeId);
                    setSelectedFishImage(fish.fishImage);
                  }}
                />
              ))
            ) : (
              <p>획득한 물고기가 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
