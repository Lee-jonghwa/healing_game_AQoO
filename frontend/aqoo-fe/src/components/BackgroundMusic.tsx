// src/components/BackgroundMusic.tsx
"use client";

import { useEffect, useRef } from "react";

import { bgMusicVolumeState } from "@/store/soundAtom";
import { usePathname } from "next/navigation";
import { useRecoilValue } from "recoil";
import { useSound } from "@/hooks/useSound";

// ✅ 특정 패턴으로 시작하는 페이지에 배경음악 설정
const pageMusicPatterns: Record<string, string> = {
  "/mypage": "/sounds/bgm-2.mp3", // ✅ "/mypage"로 시작하는 모든 페이지
  "/gameroom": "/sounds/bgm-1.mp3", // ✅ "/game"으로 시작하는 모든 페이지
  "/room": "/sounds/bgm-2.mp3", // ✅ "/room"으로 시작하는 모든 페이지
};

// ✅ 특정한 페이지에 배경음악 설정 (정확한 경로 매칭)
const pageMusicMap: Record<string, string> = {
  "/": "/sounds/bgm-3.mp3",
  "/main": "/sounds/bgm-3.mp3", // 메인 페이지
  default: "/sounds/bgm-3.mp3", // 기본값
};

const BackgroundMusic = () => {
  const pathname = usePathname(); // ✅ 현재 페이지 경로 가져오기
  const volume = useRecoilValue(bgMusicVolumeState) / 100; // 0~1로 변환

  // ✅ 특정 패턴에 해당하는 배경음악 찾기
  let currentMusic = pageMusicMap.default;
  for (const prefix in pageMusicPatterns) {
    if (pathname.startsWith(prefix)) {
      currentMusic = pageMusicPatterns[prefix]; // 해당 패턴의 배경음악 적용
      break;
    }
  }

  // ✅ 정확한 경로 매핑이 있으면 덮어쓰기
  if (pageMusicMap[pathname]) {
    currentMusic = pageMusicMap[pathname];
  }

  const { play, setVolume } = useSound(currentMusic, true, volume);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!hasPlayed.current) {
      play();
      hasPlayed.current = true;
    }
  }, [play, currentMusic]); // ✅ 페이지가 바뀔 때 새로운 음악 재생

  useEffect(() => {
    setVolume(volume); // ✅ 볼륨 조절 반영
  }, [volume]);

  return null;
};

export default BackgroundMusic;
