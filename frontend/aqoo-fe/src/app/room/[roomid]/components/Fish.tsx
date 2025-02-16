'use client';

import { useEffect, useRef, useState } from 'react';
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

  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });

  // 화면 크기 변화에 따른 컨테이너 크기 업데이트
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    // 윈도우 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', updateContainerSize);

    // 컴포넌트가 마운트될 때 초기 크기 설정
    updateContainerSize();

    // cleanup 함수로 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // 🎯 물고기를 클릭했을 때 축소 애니메이션 효과
  const handleClick = () => {
    if (fishRef.current) {
      gsap.to(fishRef.current, {
        scale: 0.9,
        duration: 0.15,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: 1,
      });
    }
  };

  useEffect(() => {
    // fishRef.current와 containerRef.current가 모두 유효한 경우에만 실행
    if (!fishRef.current || !containerRef.current) return;

    const { width: containerWidth, height: containerHeight } = containerSize;

    // 🎯 물고기의 초기 위치를 컨테이너 내부 랜덤한 곳으로 설정
    const initialX = Math.random() * (containerWidth - 100);
    const initialY = Math.random() * (containerHeight - 100);
    gsap.set(fishRef.current, { x: initialX, y: initialY });

    const moveFish = () => {
      if (!fishRef.current) return;

      // 🎯 속도를 5 ~ 12초 범위에서 랜덤하게 설정
      const randomSpeed = Math.random() * 7 + 5;

      // 🎯 이동 범위를 조정하여 자연스러운 움직임 구현
      const moveDistanceX = containerWidth * (Math.random() - 0.5); // -50% ~ +50%
      const moveDistanceY = containerHeight * (0.05 + Math.random() * 0.15); // 5% ~ 20%

      let newX = parseFloat(gsap.getProperty(fishRef.current, 'x') as string) + moveDistanceX;
      let newY = parseFloat(gsap.getProperty(fishRef.current, 'y') as string) + moveDistanceY;

      // 🎯 컨테이너 내부로 제한
      const leftBoundary = 0;
      const rightBoundary = containerWidth - 100;
      const topBoundary = 0;
      const bottomBoundary = containerHeight - 100;

      newX = Math.max(leftBoundary, Math.min(newX, rightBoundary));
      newY = Math.max(topBoundary, Math.min(newY, bottomBoundary));

      // 🎯 이동 방향에 따라 물고기 반전
      directionRef.current = moveDistanceX > 0 ? -1 : 1;

      gsap.to(fishRef.current, {
        x: newX,
        y: newY,
        scaleX: directionRef.current,
        duration: randomSpeed,
        ease: 'power2.inOut',
        onUpdate: () => {
          const prevX = parseFloat(gsap.getProperty(fishRef.current, 'x') as string);
          directionRef.current = newX > prevX ? -1 : 1;
          gsap.set(fishRef.current, { scaleX: directionRef.current });
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
  }, [containerSize]); // containerSize가 변경될 때마다 재실행

  return (
    <div
      ref={containerRef}
      className="absolute w-[1265px] h-[650px] top-[20px] left-[20px] border border-black border-transparent"
      style={{ pointerEvents: 'none' }} // 클릭 이벤트가 컨테이너에 영향을 주지 않도록 설정
    >
      <img
        ref={fishRef}
        src={fish.fishImage}
        alt={fish.fishName}
        width={100}
        height={100}
        className="absolute"
        onClick={handleClick} // 물고기를 클릭하면 축소 애니메이션 실행
        style={{
          pointerEvents: 'auto',
          zIndex: 9999,
        }} // 물고기는 클릭 가능하도록 설정
      />
    </div>
  );
}
