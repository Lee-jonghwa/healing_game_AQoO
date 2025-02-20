import { atom } from "recoil";

export const screenStateAtom = atom<"chat" | "game">({
    key: "screenStateAtom",
    default: "chat",
});