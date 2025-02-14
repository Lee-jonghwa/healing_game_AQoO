"use client";

interface CollectionItemCardProps {
  name: string;
  count: number;
  imageSrc: string;
}

export default function CollectionItemCard({ name, count, imageSrc }: CollectionItemCardProps) {
  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden w-full h-full">
      {/* 이미지 영역은 부모 높이의 60%를 차지하도록 설정 */}
      <img
        src={imageSrc}
        alt={name}
        className="w-full h-[60%] object-contain"
      />
      {/* 텍스트 영역은 나머지 40%를 사용 */}
      <div className="h-[40%] p-1 flex items-center justify-center">
        <h3 className="text-sm font-semibold">{name}</h3>
      </div>
      {/* 개수가 1보다 클 경우 우측 상단에 표시 */}
      {count > 1 && (
        <div className="absolute top-0 right-0 m-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
          {count}
        </div>
      )}
    </div>
  );
}
