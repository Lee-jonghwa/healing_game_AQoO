"use client";

import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LevelUpModal({ onClose, level }: { onClose: () => void; level: number }) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "gacha">("select");
  const [fish, setFish] = useState<{ name: string; image: string } | null>(null);

  const handleGacha = async () => {
    // TODO 물고기 뽑기 API 호출

    const newFish = { name: "블루탱", image: "/fish-2.png" };
    setFish(newFish);
    setStep("gacha");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white border-[4px] border-black rounded-lg p-6 w-[500px] text-center shadow-lg">
        {/* 1️⃣ 🎉 레벨업 선택 화면 */}
        {step === "select" && (
          <>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 min-w-[300px]  flex items-center text-center px-4 py-2 bg-white border-[2px] border-black rounded-md shadow-md">
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="mr-2" />
              <h2 className="text-4xl font-bold tracking-widest text-black">Level Up!</h2>
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="ml-2 scale-x-[-1]" />
            </div>

            {/* 레벨업 설명 */}
            <p className="mt-4 text-lg font-bold text-black">
              레벨이 올라 물고기를 한 마리 더 키울 수 있습니다! <br />
              물고기를 얻으러 가볼까요?
            </p>

            {/* 선택 버튼 */}
            <div className="flex justify-center space-x-6 mt-6">
              <button
                className="w-[180px] py-3 bg-blue-200 border-[2px] border-black rounded-lg text-lg font-bold hover:bg-blue-300 transition"
                onClick={handleGacha}
              >
                🐠 물고기 뽑기
              </button>
              <button
                className="w-[180px] py-3 bg-gray-200 border-[2px] border-black rounded-lg text-lg font-bold hover:bg-gray-300 transition"
                onClick={() => router.push("/custom")}
              >
                🎨 물고기 그리기
              </button>
            </div>

            {/* 닫기 버튼 */}
            {/* <button
              className="mt-6 px-6 py-2 bg-red-500 text-white border-[3px] border-black rounded-lg text-lg font-bold hover:bg-red-600 transition"
              onClick={onClose}
            >
              닫기
            </button> */}
          </>
        )}
        {/* 2️⃣ 🐠 물고기 뽑기 결과 (모달 내에서 처리) */}
        {step === "gacha" && fish && (
          <>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 min-w-[350px]  flex items-center justify-center text-center px-4 py-2 bg-white border-[2px] border-black rounded-md shadow-md">
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="mr-2" />
              <h2 className="text-4xl font-bold tracking-widest text-black">물고기 뽑기</h2>
              <Image src="/icon/levelupIcon.png" alt="level up" width={32} height={32} className="ml-2 scale-x-[-1]" />
            </div>

            <div className="flex flex-col items-center">
              {/* TODO 후광 추가 + 뽑는 애니메이션 가능하면 */}
              <img src={fish.image} alt={fish.name} className="h-24 my-16" />
              <p className="mt-2 text-lg">
                신규! <strong>{fish.name}</strong> 을(를) 획득!
              </p>
            </div>
            <div className="flex gap-4 mt-8 justify-center">
              <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                어항에 추가
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-gray-300 border rounded-lg">
                메인 화면으로
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
