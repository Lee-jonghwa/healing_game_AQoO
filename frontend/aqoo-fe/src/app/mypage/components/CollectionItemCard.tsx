"use client";

// 공통으로 사용할 아이템 카드 컴포넌트
// name: 아이템 이름 (예: '거북이 1')
// count: 아이템 수량
// imageSrc: 이미지 경로
interface CollectionItemCardProps {
  name: string;
  count?: number;
  rarity?: string;
  imageSrc: string;
  isModal?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

type Rarity = "COMMON" | "RARE" | "EPIC";

const rarityColors: Record<Rarity, string> = {
  COMMON: "text-gray-500 bg-gray-200 border-gray-400",
  RARE: "text-blue-500 bg-blue-200 border-blue-400",
  EPIC: "text-purple-500 bg-yellow-200 border-yellow-400",
};

function getRarityColor(rarity: string | undefined): string {
  if (!rarity) return "";
  if (rarity === "COMMON" || rarity === "RARE" || rarity === "EPIC") {
    return rarityColors[rarity as Rarity];
  }
  return "";
}

export default function CollectionItemCard({
  name,
  count,
  rarity,
  imageSrc,
  isModal = false,
  isSelected = false,
  onClick,
}: CollectionItemCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col mt-2 ml-2
        w-[25vw] sm:w-[9.9vw] h-auto aspect-square flex-shrink-0
        items-center justify-center
        rounded-lg sm:rounded-xl border border-black bg-white
        text-[1.5em] font-bold
        transition-all duration-200
        ${
          isModal
            ? "hover:border-1 sm:hover:border-4 hover:border-green-400 [box-shadow:0px_0px_0px_1px_rgba(0,0,0,0.5)]"
            : "[box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]"
        }
        ${isModal && isSelected ? "border-1 sm:border-4 border-yellow-400" : ""}
      `}
      style={{
        transform: "scale(1)",
      }}
    >
      <div
        className={`
          w-[90%] sm:w-[95%] h-auto aspect-square
          flex flex-col items-center justify-start
          rounded-xl border border-black bg-white
          sm:gap-1
          overflow-hidden
          relative
        `}
      >
        {imageSrc !== "https://i12e203.p.ssafy.io/images/미등록이미지.png" &&
          !isModal &&
          count !== undefined &&
          count !== null &&
          count > 0 && (
            <p
              className="
          absolute top-0 right-1
          text-[10px] sm:text-[13px] text-gray-500"
            >
              x {count}
            </p>
          )}
        <div className="flex-1 flex items-center justify-center w-full h-auto aspect-square overflow-hidden">
          <img src={imageSrc} alt={name} className="object-contain max-w-full max-h-full w-full h-full" />
        </div>
        <div
          className="
          flex flex-col items-center gap-1 text-[15px] text-black
        "
        >
          {rarity && (
            <p
              className={`px-1 sm:px-3 sm:mt-2 text-[8px] sm:text-xs sm:font-semibold border rounded-full ${getRarityColor(
                rarity
              )}`}
            >
              {rarity}
            </p>
          )}
          <p
            className="
          flex flex-col items-center gap-1
          text-[11px] sm:text-[1.5em] text-black
        "
          >
            {name}
          </p>
        </div>
      </div>
      {/* 배율이 120% 이상이면 크기를 줄이는 스타일 */}
      <style jsx>{`
        @media (min-width: 1200px) {
          div {
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}

{
  /* <span
className={`px-3  mt-2 text-lg font-semibold border rounded-full ${rarityColors[fish.rarity]}`}
>
{fish.rarity}
</span> */
}
