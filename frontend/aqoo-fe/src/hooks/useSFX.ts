// src/hooks/useSFX.ts

import { Howl } from "howler";
import { sfxVolumeState } from "@/store/soundAtom";
import { useRecoilValue } from "recoil";

export const useSFX = (src: string) => {
  const volume = useRecoilValue(sfxVolumeState) / 100; // 0~1 범위로 변환
  const sound = new Howl({ src: [src], volume });

  const play = () => sound.play();

  return { play };
};
