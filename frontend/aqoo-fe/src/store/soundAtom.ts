// src/recoil/soundAtom.ts

import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist(); // ✅ Recoil 상태를 영구 저장

export const bgMusicVolumeState = atom<number>({
  key: "bgMusicVolumeState",
  default: 50, // 기본값 50%
  effects_UNSTABLE: [persistAtom], // ✅ 상태 저장 적용
});

export const sfxVolumeState = atom<number>({
  key: "sfxVolumeState",
  default: 50, // 기본값 50%
  effects_UNSTABLE: [persistAtom], // ✅ 상태 저장 적용
});
