// src/hooks/useSound.ts

import { useEffect, useRef } from "react";

import { Howl } from "howler";

export const useSound = (src: string, loop: boolean = false, volume: number = 1) => {
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (!soundRef.current) {
      // ✅ 새로운 Howl 인스턴스를 생성
      soundRef.current = new Howl({
        src: [src],
        loop,
        volume,
        autoplay: true, // 자동 재생
      });
    } else {
      // ✅ 볼륨 변경 적용
      soundRef.current.volume(volume);
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.stop();
        soundRef.current.unload();
        soundRef.current = null;
      }
    };
  }, [src]); // ✅ src가 변경될 때만 실행 (볼륨 조절 시 재생이 멈추지 않도록)

  const play = () => soundRef.current?.play();
  const stop = () => soundRef.current?.stop();
  const setVolume = (vol: number) => soundRef.current?.volume(vol);

  return { play, stop, setVolume };
};
