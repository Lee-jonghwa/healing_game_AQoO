"use client";

import FishTicketModal from "@/components/FishTicketModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LevelUpModal({
  onClose,
  level,
  onOpenFishModal,
}: {
  onClose: () => void;
  level: number;
  onOpenFishModal: () => void; // ✅ FishTicketModal을 여는 함수 추가
}) {
  const router = useRouter();
  const [showFishModal, setShowFishModal] = useState(false); // ✅ FishTicketModal 상태 추가

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white border-[4px] border-black rounded-lg p-6 w-[500px] text-center shadow-lg">
        {/* 🎉 레벨업 타이틀 */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 min-w-[320px] flex items-center text-center px-4 py-2 bg-white border-[2px] border-black rounded-md shadow-md">
          <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="mr-2" />
          <h2 className="text-4xl font-bold tracking-widest text-black">Level Up!</h2>
          <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="ml-2 scale-x-[-1]" />
        </div>

        <p className="mt-4 text-lg font-bold text-black">레벨이 올라 물고기를 한 마리 더 키울 수 있습니다!</p>

        <div className="flex justify-center space-x-6 mt-6">
          <button
            className="w-[240px] py-3 bg-blue-200 border-[2px] border-black rounded-lg text-lg font-bold hover:bg-blue-300 transition"
            onClick={() => {
              onClose(); // ✅ LevelUpModal 닫기
              onOpenFishModal(); // ✅ FishTicketModal 열기
            }}
          >
            🐠 물고기 얻으러 가기
          </button>
          <button
            className="w-[240px] py-3 bg-gray-200 border-[2px] border-black rounded-lg text-lg font-bold hover:bg-gray-300 transition"
            onClick={onClose}
          >
            🎨 다음에 얻기
          </button>
        </div>
      </div>
    </div>
  );
}
