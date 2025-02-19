import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const introPages = [
  {
    title: "AQoO에 오신 걸 환영합니다!",
    description: "AQoO는 지친 여러분을 위한 방치형 힐링 게임입니다. \n 귀여운 물고기들과 함께 스트레스를 날려보세요!",
    image: "/images/intro1.png"
  },
  {
    title: "물고기 수집",
    description: "다양한 종류의 물고기를 수집하고, 성장시키며 새로운 친구를 만나보세요!",
    image: "/images/intro2.png"
  },
  {
    title: "어항 꾸미기",
    description: "나만의 어항을 꾸미고, 특별한 오브젝트와 함께 독창적인 공간을 만들어보세요.",
    image: "/images/intro3.png"
  }
];

export default function GameIntroModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [page, setPage] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative sm:max-w-[800px] sm:h-[500px] bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center overflow-hidden">
        {/* 닫기 버튼 */}
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" onClick={onClose}>
          <X size={24} />
        </button>

        {/* 슬라이드 컨테이너 */}
        <div className="relative w-full h-full overflow-hidden">
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {introPages.map((item, index) => (
              <div key={index} className="w-full flex-shrink-0 flex flex-col items-center text-center">
                <img src={item.image} alt="Intro" className="w-64 h-40 object-cover rounded-lg" />
                <h2 className="mt-4 sm:text-3xl font-bold">{item.title}</h2>
                <p className="mt-2 sm:text-lg text-gray-600">
                  {item.description.split("\n").map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
                  </p>
              </div>
            ))}
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="absolute bottom-6 flex w-full justify-between px-6">
          <button
            className={`p-2 ${page === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"} rounded-full`}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
          >
            <ChevronLeft size={28} />
          </button>
          <button
            className={`p-2 ${page === introPages.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200"} rounded-full`}
            onClick={() => setPage((prev) => Math.min(prev + 1, introPages.length - 1))}
            disabled={page === introPages.length - 1}
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
