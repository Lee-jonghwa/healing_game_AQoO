"use client";

interface CollectionItemCardProps {
  name: string;
  count: number;
  imageSrc: string;
}

export default function CollectionItemCard({ name, count, imageSrc }: CollectionItemCardProps) {
  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden w-[100%] h-28 hover:bg-gray-100 hover:shadow-xl transition-all duration-300"> {/* 호버 시 배경색과 그림자 변경 */}
      {/* 이미지에 위쪽 여백 추가 */}
      <img
        src={imageSrc}
        alt={name}
        className="w-full h-[50%] object-contain mt-2" 
      />
      {/* 텍스트 영역을 카드 높이의 나머지 50%로 설정 */}
      <div className="h-[50%] p-1 flex items-center justify-center">
        <h3 className="text-xs font-semibold text-ellipsis overflow-hidden whitespace-nowrap w-full text-center">
          {name}
        </h3>
      </div>
      {/* 개수가 1보다 클 경우 우측 상단에 표시 */}
      {count > 1 && (
        <div className="absolute top-0 right-0 m-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xm">
          {count}
        </div>
      )}
    </div>
  );
}
