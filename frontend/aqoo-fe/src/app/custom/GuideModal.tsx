import { useState } from "react";
import Image from "next/image";

const guideSteps = [
  {
    image: "/guide/custom-step01.png", // 예시 이미지
    text: "물고기의 머리가 왼쪽을 향하도록 그려주세요! \n 그래야 물고기가 똑바로 움직일 수 있어요!",
  },
  {
    image: "/guide/custom-step02.png", // 예시 이미지
    text: "그린 그림은 픽셀화하여 저장됩니다!",
  },
  {
    image: "/guide/custom-step03.png", // 예시 이미지
    text: "기존 물고기와 비슷한 느낌을 내고 싶다면 \n 두껍고 검은 테두리를 그려주세요!",
  },
  {
    image: "/guide/custom-step04.png", // 예시 이미지
    text: "색 채우기를 까먹지 마세요! \n 테두리 물고기가 되어버려요!",
  },
];

export default function GuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md text-center relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl">
          ✖
        </button>

        <Image
          src={guideSteps[currentSlide].image}
          alt={`Guide Step ${currentSlide + 1}`}
          width={300}
          height={300}
          className="mx-auto mb-4 "
        />

        <p className="text-lg font-semibold whitespace-pre-line border-black border-[1px] p-2 mb-8">
          {guideSteps[currentSlide].text}
        </p>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            className="px-4 py-2 bg-gray-300 rounded-lg shadow-md disabled:opacity-50"
            disabled={currentSlide === 0}
          >
            ◀ 이전
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, guideSteps.length - 1))}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md disabled:opacity-50"
            disabled={currentSlide === guideSteps.length - 1}
          >
            다음 ▶
          </button>
        </div>
      </div>
    </div>
  );
}
