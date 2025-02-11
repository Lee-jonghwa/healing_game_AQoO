import { useState } from "react";
import CollectionItemCard from "../components/CollectionItemCard";
import Modal from "./Modal";

interface MyFishChangeModalProps {
  onClose: () => void;
}

export default function MyFishChangeModal({ onClose }: MyFishChangeModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const images = [
    "대표이미지샘플 (2).png",
    "대표이미지샘플 (3).png",
    "대표이미지샘플 (4).png",
    "대표이미지샘플 (5).png",
    "대표이미지샘플 (6).png",
    "대표이미지샘플 (7).png",
    "대표이미지샘플 (8).png",
    "대표이미지샘플 (9).png",
    "대표이미지샘플 (10).png",
  ];

  return (
    <Modal onClose={onClose} className="overflow-y-auto w-[1000px] h-[550px] p-6">
      <h3 className="text-3xl font-semibold mb-4">대표 물고기 수정</h3>
      <button className="px-4 py-2 bg-gray-300 rounded mr-2" onClick={onClose}>
        취소
      </button>
      <button className="px-4 py-2 bg-blue-600 text-white rounded">변경완료</button>
      <div className="flex justify-end mt-6">
        <div id="one-panel" className="flex flex-wrap">
          {Array(50)
            .fill(null)
            .map((_, index) => {
              // index에 해당하는 이미지가 있으면 쓰고, 없으면 배경 샘플
              const imageSrc = images[index] ? `/images/${images[index]}` : `/images/배경샘플.png`;

              return (
                <CollectionItemCard
                  key={index}
                  imageSrc={imageSrc}
                  name={`거북이 ${index + 1}`}
                  count={11}
                  isModal={true}
                  isSelected={index === selectedId}
                  onClick={() => setSelectedId(index)}
                />
              );
            })}
        </div>
      </div>
    </Modal>
  );
}
