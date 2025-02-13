'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FishData {
  fishId: number;
  fishName: string;
  fishImage: string;
}

export default function Fish({ fish }: { fish: FishData }) {
  const fishRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef(1);

  const handleClick = () => {
    if (!fishRef.current) return;
    gsap.to(fishRef.current, {
      scale: 0.9,
      duration: 0.15,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 1,
    });
  };

  useEffect(() => {
    if (!fishRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    const moveFish = () => {
      if (!fishRef.current) return;

      const randomSpeed = Math.random() * 7 + 9;

      // 🎯 이동 범위를 `div` 안으로 제한
      const moveDistanceX = containerWidth * (Math.random() * 1.2 - 1.0); // -100% ~ +20%
      let moveDistanceY = containerHeight * (0.1 + Math.random() * 0.15);

      let newX = parseFloat(gsap.getProperty(fishRef.current, "x") as string) + moveDistanceX;
      let newY = parseFloat(gsap.getProperty(fishRef.current, "y") as string) + moveDistanceY;

      // 🎯 div 안에서만 움직이도록 제한
      const leftBoundary = 0;
      const rightBoundary = containerWidth - 100;
      const topBoundary = 0;
      const bottomBoundary = containerHeight - 100;

      newX = Math.max(leftBoundary, Math.min(newX, rightBoundary));
      newY = Math.max(topBoundary, Math.min(newY, bottomBoundary));

      // X 이동 방향에 따라 물고기 반전
      directionRef.current = moveDistanceX > 0 ? -1 : 1;

      gsap.to(fishRef.current, {
        x: newX,
        y: newY,
        scaleX: directionRef.current,
        duration: randomSpeed,
        ease: "power2.inOut",
        onUpdate: () => {
          const prevX = parseFloat(gsap.getProperty(fishRef.current, "x") as string);
          directionRef.current = newX > prevX ? -1 : 1;
          gsap.set(fishRef.current, { scaleX: directionRef.current });
        },
        onComplete: moveFish,
      });
    };

    moveFish();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute w-[1400px] h-[900px] top-[20px] left-[20px] border border-black"
      style={{ pointerEvents: "none" }} // 버튼 클릭 방해 방지!
    >
      <img
        ref={fishRef}
        src={fish.fishImage}
        alt={fish.fishName}
        width={100}
        height={100}
        className="absolute"
        onClick={handleClick}
        style={{ pointerEvents: "auto" }} // 물고기 클릭은 가능!
      />
    </div>
  );
}
