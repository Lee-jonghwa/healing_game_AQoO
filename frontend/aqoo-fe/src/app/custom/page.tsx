"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomFishPages() {
  const router = useRouter();
  const [fishImage, setFishImage] = useState<string | null>(null); // 🎨 그림 저장용 상태
  const [drawingData, setDrawingData] = useState<any>(null); // 실제 그림 데이터

  const handleSaveDrawing = () => {
    if (!drawingData) return;

    // 🖼️ 그림 데이터를 이미지로 변환 (예시)
    const newFishImage = "/fish-custom.png"; // TODO: 캔버스에서 데이터 가져오기
    setFishImage(newFishImage);

    // 🚀 그림을 저장하고 이름 짓기 페이지로 이동
    router.push(`/custom/fish-name?fishImage=${encodeURIComponent(newFishImage)}`);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-200">
      <h2 className="text-3xl font-bold text-center mb-4">🎨 물고기 그리기</h2>

      {/* 🎨 캔버스 자리 */}
      <div className="w-80 h-80 bg-white border-2 border-black mb-4">{/* TODO: 캔버스 구현 */}</div>

      <div className="flex gap-4">
        <button onClick={() => router.back()} className="px-6 py-3 bg-gray-400 text-white rounded-lg">
          취소하기
        </button>
        <button onClick={handleSaveDrawing} className="px-6 py-3 bg-green-500 text-white rounded-lg">
          그리기 완료
        </button>
      </div>
    </div>
  );
}
