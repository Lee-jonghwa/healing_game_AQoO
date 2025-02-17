'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface FishData {
  fishId: number;
  fishName: string;
  fishImage: string;
}

interface FishProps {
  fish: FishData;
  message?: string;
}

export default function Fish({ fish, message }: FishProps) {
  const fishRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef(1);
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [fishPosition, setFishPosition] = useState({ x: 0, y: 0 });

  // ✅ 말풍선 메시지 처리 (3초 후 사라짐)
  useEffect(() => {
    if (message && message.trim() !== '') {
      setShowMessage(true);
      setCurrentMessage(message);
      console.log(`💬 Message updated: "${message}" for ${fish.fishName}`);

      const timer = setTimeout(() => {
        console.log(`💨 [DEBUG] Message cleared for ${fish.fishName}`);
        setShowMessage(false);
        setCurrentMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ 물고기 위치 추적하여 말풍선이 따라가도록 설정
  useEffect(() => {
    if (!fishRef.current) return;

    const updatePosition = () => {
      const rect = fishRef.current?.getBoundingClientRect();
      if (rect) {
        setFishPosition({ x: rect.left, y: rect.top });
      }
    };

    const positionInterval = setInterval(updatePosition, 50); // 50ms마다 위치 업데이트 (부드럽게 따라가도록)
    return () => clearInterval(positionInterval);
  }, []);

  // ✅ 물고기 움직임 유지
  useEffect(() => {
    if (!fishRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    const initialX = Math.random() * (containerWidth - 100);
    const initialY = Math.random() * (containerHeight - 100);
    gsap.set(fishRef.current, { x: initialX, y: initialY });

    const moveFish = () => {
      if (!fishRef.current) return;

      const randomSpeed = Math.random() * 7 + 5;
      const moveDistanceX = containerWidth * (Math.random() - 0.5);
      const moveDistanceY = containerHeight * (0.05 + Math.random() * 0.15);

      let newX = parseFloat(gsap.getProperty(fishRef.current, 'x') as string) + moveDistanceX;
      let newY = parseFloat(gsap.getProperty(fishRef.current, 'y') as string) + moveDistanceY;

      const leftBoundary = 0;
      const rightBoundary = containerWidth - 100;
      const topBoundary = 0;
      const bottomBoundary = containerHeight - 100;

      newX = Math.max(leftBoundary, Math.min(newX, rightBoundary));
      newY = Math.max(topBoundary, Math.min(newY, bottomBoundary));

      directionRef.current = moveDistanceX > 0 ? -1 : 1;

      gsap.to(fishRef.current, {
        x: newX,
        y: newY,
        duration: randomSpeed,
        ease: 'power2.inOut',
        onComplete: moveFish,
      });
    };

    moveFish();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute w-[1265px] h-[650px] top-[20px] left-[20px] border border-transparent"
      style={{ pointerEvents: 'none' }}
    >
      {/* 🗨️ 말풍선 (물고기 위치 따라감) */}
      {showMessage && currentMessage && (
        <div
          className="absolute bg-white px-3 py-1 rounded-lg shadow-md text-sm text-gray-900 border border-gray-400"
          style={{
            top: fishPosition.y - 30, // 물고기 위에 위치
            left: fishPosition.x + 25, // 물고기 중앙 정렬
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {currentMessage}
        </div>
      )}

      {/* 🐟 물고기 이미지 */}
      <img
        ref={fishRef}
        src={fish.fishImage}
        alt={fish.fishName}
        width={100}
        height={100}
        className="absolute"
        style={{
          pointerEvents: 'auto',
          zIndex: 9999,
        }}
      />
    </div>
  );
}
