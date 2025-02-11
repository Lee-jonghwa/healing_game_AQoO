"use client";

import { useState, useEffect } from "react";
import FishTankTabContent from "./FishTankTabContent";
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";
import axiosInstance from "@/services/axiosInstance"; // baseURL: http://i12e203.p.ssafy.io:8089/api/v1

// 탭 데이터 타입 정의
interface AquariumTab {
  id: number;
  name: string;
}

export default function FishTankTabs() {
  // Recoil에서 현재 로그인한 유저 정보 가져오기
  const auth = useRecoilValue(authAtom);

  // 탭 배열 state (어항 목록: id와 이름)
  const [tabs, setTabs] = useState<AquariumTab[]>([]);
  // 현재 선택된 탭 인덱스
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // 편집 모드 상태: 편집 중인 탭의 인덱스 (null이면 편집 중 아님)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // 편집 중인 탭의 새 이름
  const [editingName, setEditingName] = useState<string>("");

  // 유저의 어항 목록을 API에서 가져오기
  useEffect(() => {
    if (auth.user?.id) {
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

  // 어항 생성하기 버튼 클릭 시 처리 (최대 5개까지 생성)
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
          // 응답 데이터에 생성된 어항의 id가 있다면 사용, 없으면 임시로 Date.now() 사용
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

  // 탭 클릭 시: 활성 탭 클릭하면 편집 모드로 전환, 그 외 단순 선택
  const handleTabClick = (idx: number) => {
    if (idx === selectedIndex) {
      setEditingIndex(idx);
      setEditingName(tabs[idx].name);
    } else {
      setSelectedIndex(idx);
      setEditingIndex(null);
    }
  };

  // 탭 이름 업데이트: 편집 종료 시 (포커스 아웃 또는 Enter 키 입력 시)
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

  return (
    <div className="flex flex-col h-full overflow-hidden mb-2 mt-2">
      {/* 탭 버튼 영역 */}
      <div className="flex items-end mb-0">
        {tabs.map((tab, idx) => (
          <div key={tab.id}>
            {editingIndex === idx ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleTabNameUpdate}
                onKeyDown={handleKeyDown}
                className="cursor-text inline-flex items-center justify-center w-[150px] h-10 px-[20px] py-[10px] mr-1 rounded-t-xl border-t border-r border-l border-[#1c5e8d] bg-white text-[#070707] font-[NeoDunggeunmo_Pro] font-normal leading-normal text-sm"
                autoFocus
              />
            ) : (
              <button
                onClick={() => handleTabClick(idx)}
                className={`
                  cursor-pointer inline-flex items-center justify-center
                  w-[150px] h-10 px-[20px] py-[10px] mr-1
                  rounded-t-xl border-t border-r border-l border-[#1c5e8d]
                  bg-[#f0f0f0] [box-shadow:-1px_0px_0px_2px_rgba(0,0,0,0.25)_inset]
                  text-[#070707] text-sm font-[NeoDunggeunmo_Pro] font-normal leading-normal
                  ${selectedIndex === idx ? "bg-[#31A9FF] text-black border-t-[3px] border-black hover:bg-[#2b8ac0]" : ""}
                `}
                title={selectedIndex === idx ? "클릭하여 이름 수정" : ""}
              >
                {tab.name}
              </button>
            )}
          </div>
        ))}

        {/* 어항 생성하기 버튼 */}
        <button
          onClick={handleAddTank}
          className={`
              cursor-pointer inline-flex items-center justify-center
              w-[200px] h-10 px-[20px] py-[10px] mr-1
              rounded-t-xl border-t border-r border-l border-[#1c5e8d]
              bg-[#f0f0f0] [box-shadow:-1px_0px_0px_2px_rgba(0,0,0,0.25)_inset]
              text-[#070707] text-2xl font-[NeoDunggeunmo_Pro] font-normal leading-normal
            `}
        >
          어항 생성하기
        </button>
      </div>

      {/* 실제 탭 컨텐츠 영역 */}
      <div
        className="
          w-[1300px] h-full m-0 p-0 overflow-hidden
          rounded-xl rounded-tl-none border-2 border-[#1c5e8d] bg-[#31a9ff]
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.25)_inset]
          flex flex-col
        "
      >
        {tabs.length > 0 ? (
          <FishTankTabContent
            aquariumId={tabs[selectedIndex].id}
            aquariumName={tabs[selectedIndex].name}
          />
        ) : (
          <div className="flex justify-center items-center h-full">
            어항 정보가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
