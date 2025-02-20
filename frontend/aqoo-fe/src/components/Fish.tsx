"use client";

import React, { useEffect, useRef, useState } from "react";

import Image from "next/image";
import { gsap } from "gsap";
import { useSFX } from "@/hooks/useSFX"; // ✅ useSFX 적용

// 🔹 물고기 데이터 타입 정의
export interface FishData {
  fishName: string;
  fishImage: string;
  size?: "XS" | "S" | "M" | "L" | "XL"; // size는 선택적 속성
}

interface FishProps {
  fish: FishData;
  handleIncreaseExp?: (earnedExp: number) => Promise<void>;
}

export default function Fish({ fish, handleIncreaseExp, }: FishProps) {
  const fishRef = useRef<HTMLImageElement | null>(null);
  const directionRef = useRef(1);
  const [isHovered, setIsHovered] = useState(false);
  const { play } = useSFX("/sounds/pop-02.mp3");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleClick = ({ clientX, clientY }: React.MouseEvent)  => {

    if (!fishRef.current) return;

    //sound
    play();

    //animation
    if (!fishRef.current) return;
    gsap.to(fishRef.current, {
      scale: 0.9,
      duration: 0.15,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 1,
    });

    if(handleIncreaseExp){
      // 경험치 이펙트 추가
      createExpEffect(clientX, clientY);

      //exp
      handleIncreaseExp(1);
    }
  };

  const createExpEffect = (x: number, y: number) => {
    const expDiv = document.createElement("div");
    expDiv.innerText = "+1 EXP";
    expDiv.style.position = "absolute";
    expDiv.style.left = `${x}px`;
    expDiv.style.top = `${y}px`;
    expDiv.style.fontSize = "16px";
    expDiv.style.fontWeight = "bold";
    expDiv.style.color = "#FFD700"; // 금색 계열
    expDiv.style.pointerEvents = "none";
    document.body.appendChild(expDiv);

    gsap.to(expDiv, {
      y: -30,
      opacity: 0,
      duration: 1.2,
      ease: "power1.out",
      onComplete: () => {
        document.body.removeChild(expDiv);
      },
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!fishRef.current) return;

    const { width, height } = windowSize;
    const size = fish.size ?? "S"; // size가 없으면 "S"로 기본값 설정
    const { width: fishWidth, height: fishHeight } = getSize(size);

    //const safeMargin = (fishWidth - 70) / 2 + 90; // 물고기 사이즈에 맞는 safeMargin 계산
    const safeMargin = 0;
    const bottomMargin = 100;
    const upperLimit = height * 0.2;

    const randomStartX = Math.random() * (width - fishWidth) + safeMargin;
    const randomStartY = Math.random() * (height - bottomMargin - 50) + 50;

    gsap.set(fishRef.current, {
      x: randomStartX,
      y: randomStartY,
      scaleX: -1,
    });

    const moveFish = () => {
      if (!fishRef.current) return; // fishRef가 null인 경우 애니메이션 실행하지 않음

      const randomSpeed = Math.random() * 7 + 9;
      const maxMoveX = width * (0.4 + Math.random() * 0.4);
      let moveDistanceX = maxMoveX * (Math.random() > 0.5 ? 1 : -1);

      const currentY = parseFloat(gsap.getProperty(fishRef.current, "y") as string);
      let moveDistanceY = height * (0.1 + Math.random() * 0.15) * (Math.random() > 0.65 ? 1 : -1);

      if (currentY < upperLimit) {
        moveDistanceY = height * (0.1 + Math.random() * 0.2);
      }

      let newX = parseFloat(gsap.getProperty(fishRef.current, "x") as string) + moveDistanceX;
      let newY = currentY + moveDistanceY;

      // 왼쪽과 오른쪽 끝 범위를 동일하게 조정
      if (newX < safeMargin) {
        newX = safeMargin;
        moveDistanceX = Math.abs(moveDistanceX);
      }
      if (newX > width - safeMargin - fishWidth) {
        newX = width - safeMargin - fishWidth;
        moveDistanceX = -Math.abs(moveDistanceX);
      }
      if (newY < 50) newY = 50 + Math.random() * 30;
      if (newY > height - bottomMargin) newY = height - bottomMargin - Math.random() * 30;

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
        gsap.killTweensOf(fishRef.current); // 현재 활성화된 모든 gsap 애니메이션을 제거합니다.
      }
    };
  }, [windowSize, fish.size]); // 화면 크기와 fish.size가 변경될 때마다 애니메이션 업데이트

  const customLoader = ({ src }: { src: string }) => src;

  const getSize = (size: "XS" | "S" | "M" | "L" | "XL") => {
    const sizeMap = {
      XS: { width: 40, height: 40 },
      S: { width: 70, height: 70 },
      M: { width: 110, height: 110 },
      L: { width: 170, height: 170 },
      XL: { width: 200, height: 200 },
    };
    return sizeMap[size] || sizeMap.S; // 기본값은 "S"
  };

  const { width, height } = getSize(fish.size ?? "S"); // fish.size가 없으면 "S"로 처리

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
    </div>
  );
}
