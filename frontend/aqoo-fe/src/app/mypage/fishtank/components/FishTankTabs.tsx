"use client";

import { useState, useEffect } from "react";
import FishTankTabContent from "./FishTankTabContent";
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";
import axiosInstance from "@/services/axiosInstance";
import { fetchUser } from "@/services/authService";
import { useRouter } from "next/navigation";

interface AquariumTab {
  id: number;
  name: string;
}

interface FishTankTabsProps {
  onBackgroundChange: (newbackground: string) => void;
}

export default function FishTankTabs({ onBackgroundChange }: FishTankTabsProps) {
  const auth = useRecoilValue(authAtom);
  const router = useRouter();

  // 탭 배열 (어항 목록)
  const [tabs, setTabs] = useState<AquariumTab[]>([]);
  // 현재 선택된 탭 인덱스
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // 편집 모드 상태
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  // 삭제 모달 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [tabToDelete, setTabToDelete] = useState<AquariumTab | null>(null);
  // 대표 어항 ID 상태
  const [mainAquariumId, setMainAquariumId] = useState<number | null>(null);

  // 리프레시 트리거: MyFishCollection과 TankFishCollection을 각각 새로고침
  const [refreshMyFish, setRefreshMyFish] = useState(0);
  const [refreshTankFish, setRefreshTankFish] = useState(0);

  // 유저의 어항 목록 및 대표 어항 정보 가져오기
  useEffect(() => {
    if (auth.user?.id) {
      // fetchUser를 호출하여 대표 어항 정보 가져오기
      fetchUser()
        .then((user) => {
          if (user && typeof user.mainAquarium === "number") {
            setMainAquariumId(user.mainAquarium);
          }
        })
        .catch((error) => {
          console.error("Error fetching user info:", error);
        });

      // 어항 목록 가져오기
      axiosInstance
        .get(`/aquariums/all/${auth.user.id}`)
        .then((response) => {
          const { aquariums } = response.data;
          const newTabs: AquariumTab[] = aquariums.map((item: any) => ({
            id: item.id,
            name: item.aquariumName,
          }));
          setTabs(newTabs);
          if (newTabs.length > 0) {
            setSelectedIndex(0);
          }
        })
        .catch((error) => {
          console.error("Error fetching aquariums:", error);
        });
    }
  }, [auth.user?.id]);

  const handleAddTank = () => {
    if (tabs.length >= 5) {
      alert("어항은 최대 5개까지 생성 가능합니다.");
      return;
    }
    const newTabName = `어항 ${tabs.length + 1}`;
    if (auth.user?.id) {
      axiosInstance
        .post("/aquariums/create", {
          aquariumName: newTabName,
          userId: auth.user.id,
          aquariumBack: 1,
        })
        .then((response) => {
          const newTab: AquariumTab = {
            id: response.data?.id || Date.now(),
            name: newTabName,
          };
          setTabs([...tabs, newTab]);
          setSelectedIndex(tabs.length);
        })
        .catch((error) => {
          console.error("Error creating aquarium:", error);
          alert("어항 생성 실패");
        });
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleTabClick = (idx: number) => {
    if (idx === selectedIndex) {
      setEditingIndex(idx);
      setEditingName(tabs[idx].name);
    } else {
      setSelectedIndex(idx);
      setEditingIndex(null);
    }
  };

  const handleTabNameUpdate = async () => {
    if (editingIndex !== null) {
      const aquariumId = tabs[editingIndex].id;
      try {
        await axiosInstance.post("/aquariums/update", {
          aquariumId: aquariumId,
          type: "name",
          data: editingName,
        });
        const newTabs = [...tabs];
        newTabs[editingIndex] = { ...newTabs[editingIndex], name: editingName };
        setTabs(newTabs);
      } catch (error) {
        console.error("Error updating aquarium name:", error);
        alert("어항 이름 수정 실패");
      }
      setEditingIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTabNameUpdate();
    }
  };

  const handleDeleteClick = (idx: number) => {
    setTabToDelete(tabs[idx]);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTabToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (tabToDelete) {
      // 대표 어항 삭제 방지 로직
      if (mainAquariumId === tabToDelete.id) {
        alert("대표 어항은 삭제할 수 없습니다.");
        setShowDeleteModal(false);
        setTabToDelete(null);
        return;
      }

      // 어항 삭제 진행
      axiosInstance
        .delete("/aquariums", { data: { aquariumId: tabToDelete.id } })
        .then((response) => {
          const updatedTabs = tabs.filter((tab) => tab.id !== tabToDelete.id);
          setTabs(updatedTabs);
          if (updatedTabs.length === 0) {
            setSelectedIndex(0);
          } else if (selectedIndex >= updatedTabs.length) {
            setSelectedIndex(updatedTabs.length - 1);
          }
          setShowDeleteModal(false);
          setTabToDelete(null);
          // 어항 삭제 후, MyFishCollection이 보여야 하므로 리프레시 트리거 업데이트
          setRefreshMyFish((prev) => prev + 1);
        })
        .catch((error) => {
          console.error("Error deleting aquarium:", error);
          alert("어항 삭제 실패");
        });
    }
  };

  // "대표어항 설정" 버튼 핸들러
  const handleSetMainAquarium = async () => {
    if (!auth.user) return;
    try {
      await axiosInstance.post("/aquariums/main-aqua", {
        userId: auth.user.id,
        aquariumId: tabs[selectedIndex].id,
      });
      alert("대표 어항 설정이 완료되었습니다.");
      setMainAquariumId(tabs[selectedIndex].id);
    } catch (error) {
      console.error("Error setting main aquarium:", error);
    }
  };

  // 자식 컴포넌트에서 물고기를 추가하면 TankFishCollection을 리프레시
  const handleFishAdded = () => {
    setRefreshTankFish((prev) => prev + 1);
  };

  // 자식 컴포넌트에서 물고기를 제거하면 MyFishCollection을 리프레시
  const handleFishRemoved = () => {
    setRefreshMyFish((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden mb-2 mt-2 px-4">
      {/* 탭 버튼 영역 */}
      <div className="flex flex-wrap items-end">
        {tabs.map((tab, idx) => (
          <div key={tab.id} className="relative w-36 h-10 mr-2">
            {editingIndex === idx ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleTabNameUpdate}
                onKeyDown={handleKeyDown}
                className="w-full h-full cursor-text inline-flex items-center justify-center rounded-t-xl border-t border-r border-l border-[#1c5e8d] bg-white text-[#070707] font-[NeoDunggeunmo_Pro] text-sm"
                autoFocus
              />
            ) : (
              <button
                onClick={() => handleTabClick(idx)}
                className={`
                  w-full h-full cursor-pointer inline-flex items-center justify-center
                  rounded-t-xl border-t border-r border-l border-[#1c5e8d]
                  bg-[#f0f0f0] shadow-inner text-[#070707] text-sm font-[NeoDunggeunmo_Pro]
                  ${selectedIndex === idx ? "bg-[#31A9FF] text-black border-t-4 border-black hover:bg-[#2b8ac0]" : ""}
                `}
                title={selectedIndex === idx ? "클릭하여 이름 수정" : ""}
              >
                {tab.name}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(idx);
              }}
              className="absolute top-0 right-1 text-gray-800 hover:text-gray-900 text-xl p-1"
              title="어항 삭제"
            >
              ×
            </button>
          </div>
        ))}

        {/* 어항 생성하기 버튼 */}
        <button
          onClick={handleAddTank}
          className="cursor-pointer inline-flex items-center justify-center w-48 h-10 px-4 py-2 mr-2 rounded-t-xl border-t border-r border-l border-[#1c5e8d] bg-[#f0f0f0] shadow-inner text-[#070707] text-xl font-[NeoDunggeunmo_Pro]"
          title="어항 생성하기"
        >
          어항 생성하기
        </button>

        {/* 스타일 변경된 뒤로가기 버튼 */}
        <button
          onClick={handleGoBack}
          className="cursor-pointer inline-flex items-center justify-center w-48 h-10 px-4 py-2 mr-2 rounded-t-xl border-t border-r border-l border-red-700 bg-red-500 shadow-inner text-white text-xl font-[NeoDunggeunmo_Pro] hover:bg-red-600"
          title="뒤로가기"
        >
          뒤로가기
        </button>
      </div>

      {/* 탭 컨텐츠 영역 */}
      <div className="w-full max-w-5xl h-full mx-auto p-0 overflow-hidden rounded-xl border-2 border-[#1c5e8d] bg-[#31a9ff] shadow-inner flex flex-col">
        {tabs.length > 0 ? (
          <FishTankTabContent
            aquariumId={tabs[selectedIndex].id}
            aquariumName={tabs[selectedIndex].name}
            refreshMyFish={refreshMyFish}
            refreshTankFish={refreshTankFish}
            onFishAdded={handleFishAdded}
            onFishRemoved={handleFishRemoved}
            onSetMainAquarium={handleSetMainAquarium}
            onBackgroundChange={onBackgroundChange}
          />
        ) : (
          <div className="flex justify-center items-center h-full">어항 정보가 없습니다.</div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && tabToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
            <p className="text-lg mb-4">{tabToDelete.name} 어항을 삭제하겠습니까?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                확인
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
