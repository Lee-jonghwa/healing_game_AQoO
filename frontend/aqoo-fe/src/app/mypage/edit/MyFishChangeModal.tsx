"use client";

import { useState, useEffect } from "react";
import CollectionItemCard from "../components/CollectionItemCard";
import Modal from "./Modal";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/services/axiosInstance"; // axiosInstance 임포트
import { useRecoilState } from "recoil";
import { authAtom } from "@/store/authAtom";

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

  // Recoil을 통한 전역 auth 상태 사용 (낙관적 업데이트에 활용)
  const [auth, setAuth] = useRecoilState(authAtom);

  // 현재 대표 물고기 정보는 상위에서 받아온 userData.mainFishImage를 사용
  const currentMainFishImage = userData.mainFishImage;

  const API_BASE_URL = "https://i12e203.p.ssafy.io/images";

  // 내가 가진 fish 정보를 axiosInstance를 통해 불러오고,
  // 현재 대표 물고기와 동일한 fishImage는 필터링합니다.
  useEffect(() => {
    if (!userData.id) return;
    setIsLoading(true);
    axiosInstance
      .get<FishData[]>(`/fish/my-fish/${userData.id}`)
      .then((response) => {
        const data = response.data;
        // const filteredFish = data.filter((fish) => fish.fishImage !== currentMainFishImage);
        const sortedFishList = data.slice().sort((a, b) => {
          const aIsCurrentMain = a.fishImage === currentMainFishImage ? 1 : 0;
          const bIsCurrentMain = b.fishImage === currentMainFishImage ? 1 : 0;
          return aIsCurrentMain - bIsCurrentMain; // false(0)가 앞으로, true(1)가 뒤로
        });

        setFishList(sortedFishList);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("내 fish 정보를 불러오는 중 오류 발생:", error);
        setIsLoading(false);
      });
  }, [userData.id, currentMainFishImage]);

  // 완료 버튼 클릭 시 대표 물고기 변경 API 호출 및 낙관적 업데이트 적용
  const handleConfirm = async () => {
    if (!selectedFishImage) {
      alert("대표 물고기를 선택해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      // 파일명 추출 (예: "ImperatorAngelfish.png")
      const parsedImageName = "/" + selectedFishImage.split("/").pop() || "";
      // 서버는 이 파일명에 기본 URL을 붙여서 처리한다고 가정합니다.
      const response = await axiosInstance.post("/users", {
        userId: userData.id,
        userNickName: userData.nickname,
        mainFishImage: parsedImageName,
      });
      console.log("응답:", response.data);
      console.log("선택한 이미지:", selectedFishImage);
      console.log("파싱된 이미지:", parsedImageName);

      // 낙관적 업데이트: 전역 auth 상태에 바로 새로운 대표 이미지를 반영
      setAuth({
        ...auth,
        user: {
          ...auth.user,
          mainFishImage: selectedFishImage,
        } as any,
      });

      alert("대표 물고기 변경 성공!");
      // 서버와 동기화하기 위해 fetchUser()를 호출
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
    <Modal onClose={onClose} className="flex flex-col items-center overflow-y-auto w-[1000px] h-[550px] p-6">
      <h3 className="text-3xl font-semibold mb-4">대표 물고기 수정</h3>
      <div className="self-end flex mb-4">
        {/* <button className="px-4 py-2 bg-gray-300 rounded mr-2" onClick={onClose} disabled={isLoading}>
          취소
        </button> */}
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleConfirm} disabled={isLoading}>
          변경하기
        </button>
      </div>
      {isLoading && <p>로딩 중...</p>}
      {!isLoading && (
        <div className="flex justify-end mt-6">
          <div
            id="one-panel"
            className="
              flex flex-wrap
              grid gap-4 w-full
              grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
              overflow-y-auto max-h-[450px] scrollbar-none
            "
            >
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
