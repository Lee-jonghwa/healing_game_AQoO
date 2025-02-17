"use client";

import { AquariumData } from "@/types";

const overlayImages = {
  pollution: [
    "/effects/pollution_4.png", // 1
    "/effects/pollution_3.png", // 2
    "/effects/pollution_2.png", // 3
    "/effects/pollution_1.png", // 3
    null, // 4 이상은 표시 안 함
    null,
  ],
  // feed: [null, "/effects/feed_1.png", "/effects/feed_2.png", "/effects/feed_3.png", "/effects/feed_4.png", null],
};

// ✅ waterStatus가 4, 5일 때는 아예 표시 안 함 (null 처리)
const waterOverlayStyles = [
  "bg-yellow-900/40", // 0 - 가장 진한 노란색
  "bg-yellow-800/30", // 1
  "bg-yellow-600/20", // 2
  "bg-yellow-500/10", // 3 - 연한 노란색
  null, // 4 - 표시 안 함
  null, // 5 - 표시 안 함
];

export default function OverlayEffect({ aquariumData }: { aquariumData: AquariumData }) {
  if (!aquariumData) return null;

  const { waterStatus, pollutionStatus, feedStatus } = aquariumData;

  const pollutionOverlay = pollutionStatus < 4 ? overlayImages.pollution[pollutionStatus] : null;
  // const feedOverlay = feedStatus < 4 ? overlayImages.feed[feedStatus] : null;
  const waterOverlayClass = waterStatus < 4 ? waterOverlayStyles[waterStatus] : null; // ✅ waterStatus 4 이상이면 null

  return (
    <div className="absolute inset-0 pointer-events-none z-5">
      {/* ✅ WaterStatus 오버레이 (4,5일 때는 없음) */}
      {waterOverlayClass && <div className={`absolute inset-0 ${waterOverlayClass}`}></div>}

      {/* ✅ Pollution & Feed는 기존처럼 이미지 오버레이 */}
      {pollutionOverlay && (
        <img src={pollutionOverlay} alt="Pollution Effect" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {/* {feedOverlay && (
        <img src={feedOverlay} alt="Feed Effect" className="absolute inset-0 w-full h-full object-cover" />
      )} */}
    </div>
  );
}
