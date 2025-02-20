import { atom } from "recoil";

export const selectedGameAtom = atom<string>({
  key: "selectedGameAtom",
  default: "Game", // 기본 게임 설정
});
