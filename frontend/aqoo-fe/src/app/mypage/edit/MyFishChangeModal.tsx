"use client";

import { useState, useEffect, useRef } from "react";
import CollectionItemCard from "../components/CollectionItemCard";
import Modal from "./Modal";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/services/axiosInstance"; // axiosInstance 임포트
import { useRecoilState } from "recoil";
import { authAtom } from "@/store/authAtom";
// 타이틀 밖에 띄우기
import { createPortal } from "react-dom";

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

interface ModalTitlePortalProps {
  title: string;
  containerRect: DOMRect | null;
}

// 모달 타이틀을 별도의 Portal로 렌더링하는 컴포넌트
function ModalTitlePortal({ title, containerRect }: ModalTitlePortalProps) {
  if (!containerRect) return null;

  const isSmUp = typeof window !== "undefined" && window.innerWidth >= 640;
  // 모달 위에 표시할 오프셋 (예: 모달 위 20px 떨어진 곳)
  const offset = isSmUp ? 11 : 0;
  // 타이틀의 높이를 대략 50px로 가정 (필요시 조절)
  const titleHeight = isSmUp ? 50 : 40;

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // const top = containerRect.top - offset - titleHeight;
  // const left = containerRect.left + containerRect.width / 2;

  const top = scrollY + containerRect.top - offset - titleHeight;
  const left = scrollX + containerRect.left + containerRect.width / 2;
  return createPortal(
    <div
      style={{
        position: "absolute",
        top: top,
        left: left,
        transform: "translateX(-50%)",
      }}
      className="z-[1100] pointer-events-none"
    >
      <h1
        className="
        text-md sm:text-3xl font-bold text-black
        bg-white px-2 py-1 sm:px-6 sm:py-2
        border border-black
        rounded-lg shadow-lg"
      >
        {title}
      </h1>
    </div>,
    document.body
  );
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

  // 모달 내부 콘텐츠의 위치/크기를 측정하기 위한 ref와 상태
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [modalRect, setModalRect] = useState<DOMRect | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // 처음 모달이 렌더링될 때 높이 측정
  useEffect(() => {
    if (modalContentRef.current) {
      setModalRect(modalContentRef.current.getBoundingClientRect());
    }

    const handleResize = () => {
      if (modalContentRef.current) {
        setModalRect(modalContentRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // fishList(= 로딩된 데이터)가 바뀔 때 다시 높이 측정
  useEffect(() => {
    if (!isLoading && modalContentRef.current) {
      // 로딩이 완료된 시점에서 다시 측정
      setModalRect(modalContentRef.current.getBoundingClientRect());
    }
  }, [isLoading, fishList]);

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

  // fullscreen 모드 감지 (F11로 전체화면 전환 시)
  useEffect(() => {
    const handleFullscreenChange = () => {
      // document.fullscreenElement가 존재하면 전체화면 모드
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <>
      <ModalTitlePortal title="🐡대표 물고기 변경🐠" containerRect={modalRect} />

      <Modal
        onClose={onClose}
        className="
        flex flex-col
        items-center justify-center
        overflow-hidden
        min-w-[80%] sm:min-w-[60%] sm:p-6
        h-[60%] sm:min-h-[70%]
        relative"
      >
        {/* 모달 내부의 콘텐츠 래퍼 ref를 부여 */}
        <div ref={modalContentRef} className="relative flex flex-col w-full h-full pb-3">
          {isLoading && <p>로딩 중...</p>}
          {!isLoading && (
            <div
              className={`flex flex-1 justify-end mt-6 w-full overflow-y-auto
                ${isFullScreen ? "max-h-[550px]" : "pb-5"}`}
            >
              <div
                id="one-panel"
                className={`
                  flex flex-wrap items-center justify-center
                  grid gap-1 sm:gap-4 w-full
                  grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
                  overflow-y-auto max-h-full sm:max-h-[450px] scrollbar-hide
                  pr-1
                `}
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
          <button
            className="absolute right-0 bottom-0 sm:right-3 sm:bottom-3 px-2 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-sm sm:text-lg"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            변경하기
          </button>
        </div>
      </Modal>
    </>
  );
}
