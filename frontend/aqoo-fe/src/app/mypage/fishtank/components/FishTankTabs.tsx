"use client";

import { useState } from "react";
import FishTankTabContent from "./FishTankTabContent";

export default function FishTankTabs() {
  // 초기 탭 4개 (문자열 배열)
  const [tabs, setTabs] = useState(["어항 1", "어항 2", "어항 3", "어항 4"]);
  // 현재 선택된 탭 인덱스
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 어항 생성하기 버튼 클릭 시
  const handleAddTank = () => {
    const newTabName = `어항 ${tabs.length + 1}`;
    if (tabs.length >= 5) {
      alert("어항은 최대 5개까지 생성 가능합니다.");
      return;
    } else {
      setTabs([...tabs, newTabName]);
      // 새로 생성된 탭으로 이동
      setSelectedIndex(tabs.length);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden mb-2 mt-2">
      {/* 탭 버튼 영역 */}
      <div className="flex items-end mb-0">
        {tabs.map((tabName, idx) => (
          <button
            key={tabName}
            onClick={() => setSelectedIndex(idx)}
            className={`
              cursor-pointer inline-flex items-center justify-center
              w-[150px] h-10 px-[20px] py-[10px] mr-1
              rounded-t-xl border-t border-r border-l border-[#1c5e8d]
              bg-[#f0f0f0]
              [box-shadow:-1px_0px_0px_2px_rgba(0,0,0,0.25)_inset]
              text-[#070707] text-2xl font-[NeoDunggeunmo_Pro] font-normal leading-normal
              ${selectedIndex === idx ? "bg-[#31A9FF] text-2xl text-black border-t-[3px] border-black" : ""}
            `}
          >
            {tabName}
          </button>
        ))}

        {/* 어항 생성하기 버튼 */}
        <button
          onClick={handleAddTank}
          className="
              cursor-pointer inline-flex items-center justify-center
              w-[200px] h-10 px-[20px] py-[10px] mr-1
              rounded-t-xl border-t border-r border-l border-[#1c5e8d]
              bg-[#f0f0f0]
              [box-shadow:-1px_0px_0px_2px_rgba(0,0,0,0.25)_inset]
              text-[#070707] text-2xl font-[NeoDunggeunmo_Pro] font-normal leading-normal
          "
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
        <FishTankTabContent tabName={tabs[selectedIndex]} />
      </div>
    </div>
  );
}
