// src/components/BackgroundMusic.tsx
"use client";

import { useEffect, useRef } from "react";

import { bgMusicVolumeState } from "@/store/soundAtom";
import { usePathname } from "next/navigation";
import { useRecoilValue } from "recoil";
import { useSound } from "@/hooks/useSound";
import { screenStateAtom } from "@/store/screenStateAtom";
import { selectedGameAtom } from "@/store/gameAtom";

// ✅ 특정 패턴으로 시작하는 페이지에 배경음악 설정
const pageMusicPatterns: Record<string, string> = {
  "/mypage": "/sounds/bgm-2.mp3",
  "/gameroom": "/sounds/bgm-5.mp3",
  "/room": "/sounds/bgm-5.mp3",
};

// ✅ 특정한 페이지에 배경음악 설정 (정확한 경로 매칭)
const pageMusicMap: Record<string, string> = {
  "/": "/sounds/bgm-3.mp3",
  "/main": "/sounds/bgm-3.mp3",
  default: "/sounds/bgm-3.mp3",
};

const BackgroundMusic = () => {
  const pathname = usePathname();
  const volume = useRecoilValue(bgMusicVolumeState) / 100;
  const screenState = useRecoilValue(screenStateAtom);
;

  // ✅ 기본 배경음악 설정 (경로 기반)
  let currentMusic = pageMusicMap.default;
  for (const prefix in pageMusicPatterns) {
    if (pathname.startsWith(prefix)) {
      currentMusic = pageMusicPatterns[prefix];
      break;
    }
  }
  if (pageMusicMap[pathname]) {
    currentMusic = pageMusicMap[pathname];
  }

// ✅ 채팅방에서 screenState에 따라 배경음악 변경
if (pathname.startsWith("/room")) {
  if (screenState === "game") {
    currentMusic = "/sounds/game.mp3"; // 🎮 게임 화면에서는 게임 음악
  } else {
    currentMusic = pageMusicPatterns["/room"] || "/sounds/bgm-3.mp3"; // 💬 채팅 화면에서는 기본 채팅 음악
  }
}

  // ✅ 배경음악 변경 로직
  const { play, stop, setVolume } = useSound(currentMusic, true, volume);
  const hasPlayed = useRef(false);
  const previousMusicRef = useRef<string | null>(null);

  // ✅ 음악이 변경될 때 기존 음악을 멈추고 새로운 음악 재생
  useEffect(() => {
    if (previousMusicRef.current !== currentMusic) {
      stop(); // 기존 음악 정지
      hasPlayed.current = false;
      previousMusicRef.current = currentMusic;
    }
  }, [currentMusic, stop]);

  // ✅ 새로운 음악이 처음 재생될 때만 play 실행
  useEffect(() => {
    if (!hasPlayed.current) {
      play();
      hasPlayed.current = true;
    }
  }, [play, currentMusic]);

  useEffect(() => {
    setVolume(volume);
  }, [volume]);

  return null;
};

export default BackgroundMusic;
