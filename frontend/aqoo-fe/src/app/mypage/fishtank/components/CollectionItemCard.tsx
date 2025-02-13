"use client";

interface CollectionItemCardProps {
  name: string;
  count: number;
  imageSrc: string;
}

export default function CollectionItemCard({ name, count, imageSrc }: CollectionItemCardProps) {
  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
      <img src={imageSrc} alt={name} className="w-full h-20 object-contain sm:h-24 md:h-27" />
      <div className="p-2">
        <h3 className="text-lg font-semibold">{name}</h3>
      </div>
      {count > 1 && (
        <div className="absolute top-0 right-0 m-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
          {count}
        </div>
      )}
    </div>
  );
}
