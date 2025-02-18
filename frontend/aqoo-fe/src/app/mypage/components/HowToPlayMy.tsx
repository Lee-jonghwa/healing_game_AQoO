import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const introPages = [
  {
    title: "MyPage",
    description: "마이페이지에서는 내가 가지고 있는 물고기들을 확인할 수 있고 \n 내 어항들의 현황과 내 회원 정보를 수정할 수 있어요.",
    image: "/images/intro1.png"
  },
  {
    title: "도감관리 탭",
    description: "도감관리 탭에서는 도감에 등록되어 있는 물고기의 종류와 마릿수를 확인할 수 있어요. \n 가지고 있는 물고기는 물고기의 모습이 보이고, 그렇지 않은 물고기는 그림자로 보여요. \n 희귀 등급에 따라 등장 확률이 다르니 희귀한 물고기를 찾아 도감을 채워보세요! ",
    image: "/images/intro2.png"
  },
  {
    title: "커스텀 탭",
    description: "커스텀 탭에서는 내가 그린 물고기들을 확인할 수 있어요. \n 어때요, 내가 그린 물고기들이 마음에 드시나요? 😊",
    image: "/images/intro3.png"
  }
];

export default function GameIntroModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [page, setPage] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative sm:max-w-[60%] sm:h-[80%] bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center overflow-hidden">
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
