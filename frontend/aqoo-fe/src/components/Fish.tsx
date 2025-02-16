"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";

// 🔹 물고기 데이터 타입 정의
export interface FishData {
  aquariumId: number;
  fishId: number;
  fishTypeId: number;
  fishName: string;
  fishImage: string;
  size: "XS" | "S" | "M" | "L" | "XL";
}

interface FishProps {
  fish: FishData;
}

export default function Fish({ fish }: FishProps) {
  const fishRef = useRef<HTMLImageElement | null>(null);
  const directionRef = useRef(1);
  const [isHovered, setIsHovered] = useState(false);

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
    if (!fishRef.current) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const safeMargin = 80;
    const bottomMargin = 100;
    const upperLimit = windowHeight * 0.2;

    const randomStartX = Math.random() * (windowWidth - 2 * safeMargin) + safeMargin;
    const randomStartY = Math.random() * (windowHeight - bottomMargin - 50) + 50;

    gsap.set(fishRef.current, {
      x: randomStartX,
      y: randomStartY,
      scaleX: -1,
    });

    const moveFish = () => {
      if (!fishRef.current) return; // fishRef가 null인 경우 애니메이션 실행하지 않음

      const randomSpeed = Math.random() * 7 + 9;
      const maxMoveX = windowWidth * (0.4 + Math.random() * 0.4);
      let moveDistanceX = maxMoveX * (Math.random() > 0.5 ? 1 : -1);

      const currentY = parseFloat(gsap.getProperty(fishRef.current, "y") as string);
      let moveDistanceY = windowHeight * (0.1 + Math.random() * 0.15) * (Math.random() > 0.65 ? 1 : -1);

      if (currentY < upperLimit) {
        moveDistanceY = windowHeight * (0.1 + Math.random() * 0.2);
      }

      let newX = parseFloat(gsap.getProperty(fishRef.current, "x") as string) + moveDistanceX;
      let newY = currentY + moveDistanceY;

      if (newX < safeMargin) {
        newX = safeMargin + Math.random() * 50;
        moveDistanceX = Math.abs(moveDistanceX);
      }
      if (newX > windowWidth - safeMargin) {
        newX = windowWidth - safeMargin - Math.random() * 50;
        moveDistanceX = -Math.abs(moveDistanceX);
      }
      if (newY < 50) newY = 50 + Math.random() * 30;
      if (newY > windowHeight - bottomMargin) newY = windowHeight - bottomMargin - Math.random() * 30;

      directionRef.current = moveDistanceX > 0 ? -1 : 1;

      gsap.to(fishRef.current, {
        x: newX,
        y: newY,
        scaleX: directionRef.current,
        duration: randomSpeed,
        ease: "power2.inOut",
        onUpdate: () => {
          if (fishRef.current) {
            const prevX = parseFloat(gsap.getProperty(fishRef.current, "x") as string);
            directionRef.current = newX > prevX ? -1 : 1;
            gsap.set(fishRef.current, { scaleX: directionRef.current });
          }
        },
        onComplete: moveFish,
      });
    };

    moveFish();

    // Cleanup 함수로 애니메이션 정리
    return () => {
      if (fishRef.current) {
        gsap.killTweensOf(fishRef.current);  // 현재 활성화된 모든 gsap 애니메이션을 제거합니다.
      }
    };
  }, []);

  const customLoader = ({ src }: { src: string }) => src;

  const getSize = (size: "XS" | "S" | "M" | "L" | "XL") => {
    const sizeMap = {
      XS: { width: 40, height: 40 },
      S: { width: 70, height: 70 },
      M: { width: 110, height: 110 },
      L: { width: 170, height: 170 },
      XL: { width: 200, height: 200 },
    };
    return sizeMap[size] || sizeMap.M;
  };

  const { width, height } = getSize(fish.size);

  return (
    <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Image
        loader={customLoader}
        ref={fishRef}
        src={fish.fishImage}
        alt={fish.fishName}
        width={width}
        height={height}
        className="absolute transform-gpu"
        onClick={handleClick}
        layout="intrinsic"
        unoptimized
      />

      {/* {isHovered && <span className="mt-2 bg-black text-white text-sm px-2 py-1 rounded-md">{fish.fishName}</span>} */}
    </div>
  );
}
