"use client";

interface BackgroundListProps {
  aquariumId: number;
}

export default function BackgroundList({ aquariumId }: BackgroundListProps) {
  const backgrounds = [
    "https://i12e203.p.ssafy.io/images/bg1.png",
    "https://i12e203.p.ssafy.io/images/bg2.png",
    "https://i12e203.p.ssafy.io/images/bg3.png",
  ];

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {backgrounds.map((bg, idx) => (
        <div key={idx} className="w-40 h-24 rounded-lg overflow-hidden shadow-md">
          <img src={bg} alt={`Background ${idx + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}
