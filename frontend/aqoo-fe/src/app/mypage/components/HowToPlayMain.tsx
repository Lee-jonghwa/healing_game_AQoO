import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const introPages = [
  {
    title: "AQoO에 오신 것을 환영하니다!",
    description: "AQoO는 지친 여러분을 위해 준비한 방치형 힐링게임이에요. \n 여러분의 몸과 마음을 쉬게 도와줄 물고기들과 함께 예쁜 어항을 꾸며볼까요?",
    image: "/images/intro1.png"
  },
  {
    title: "기본 메뉴",
    description: "좌측 하단에는 여러가지 기본 기능이 있어요. \n mypage 아이콘을 누르면, 내가 가지고 있는 물고기를 볼 수 있어요. \n 회원정보도 이곳에서 수정할 수 있답니다.",
    image: "/images/intro2.png"
  },
  {
    title: "기본 메뉴",
    description: "Friends를 누르면 친구 목록을 확인할 수 있어요. \n 친구를 검색 및 초대할 수도 있고,  \n 친구의 어항에도 찾아갈 수 있어요!",
    image: "/images/intro2.png"
  },
  {
    title: "기본 메뉴",
    description: "Push는 각종 알림을 보여주는 창이에요. \n 이번엔 어떤 알림이 왔을까요? 😊",
    image: "/images/intro3.png"
  },
  {
    title: "어항 이동",
    description: "MyPage 위에 있는 화살표를 누르면 나의 다른 어항으로 이동할 수 있어요. \n 다른 어항에 있는 물고기들도 구경해봐요!🐟",
    image: "/images/intro3.png"
  },
  {
    title: "상태창",
    description: "가운데 아래 쪽에는 각종 상태가 보여요. \n exp가 요구하는 만큼 다 차면 레벨업을 할 수 있어요! \n 레벨업을 하면 뽑기 또는 그리기를 할 수 있답니다.",
    image: "/images/intro3.png"
  },
  {
    title: "어항 관리",
    description: "우측 아래 쪽에는 현재 어항의 상태가 나와 있어요. \n 상태에 따라 Water(물주기), Clean(청소하기), Feed(먹이주기)를 할 수 있어요. \n 각각의 활동을 하면 경험치를 주니 잊지말고 챙겨보세요!",
    image: "/images/intro3.png"
  },
  {
    title: "청소하기 모션 인식",
    description: "Clean을 클릭하면 어항을 깨끗하게 닦을 수 있어요. \n 카메라를 향해 손바닥을 펼치고, 좌우로 3번 왔다갔다하면 돼요! \n Tip. 카메라에 손을 가까이대고, 화면의 끝에서 끝까지 갈 수록 더 잘 된답니다🖐",
    image: "/images/intro3.png"
  },

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
