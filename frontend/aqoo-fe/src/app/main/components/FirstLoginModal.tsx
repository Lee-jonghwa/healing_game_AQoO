"use client";

import FishTicketModal from "@/components/FishTicketModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function FirstLoginModal({
  onClose,
  onOpenFishModal,
}: {
  onClose: () => void;
  onOpenFishModal: () => void; // ✅ FishTicketModal을 여는 함수 추가
}) {
  const router = useRouter();
  const { auth } = useAuth();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white border-[2px] border-black rounded-lg p-6 w-auto text-center shadow-lg">
        {/* 🎉 큰 제목  */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 min-w-[320px] flex items-center text-center px-4 py-2 bg-white border-[2px] border-black rounded-md shadow-md">
          <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="mr-2" />
          <h2 className="text-4xl font-bold tracking-widest text-black">환영합니다</h2>
          <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="ml-2 scale-x-[-1]" />
        </div>

        <p className="mt-4 text-lg font-bold text-black">
          어서 오세요. 처음 오셨군요!
          <br />
          {auth.user?.nickname} 님과 함께할 첫 물고기를 뽑으러 가보실까요?
        </p>

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
        </div>
      </div>
    </div>
  );
}
