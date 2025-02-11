import { atom } from "recoil";

export interface User {
  id: string; 
  friendId: string;  // ✅ FriendId 추가 (친구 ID)
  nickname: string;
  level: number;
  mainFishImage?: string;
  ready: boolean;
  isHost: boolean;
}

// ✅ `usersState` 정의 (기존 Friend 배열 대신 User 배열 사용)
export const usersState = atom<User[]>({
  key: "usersState",
  default: [],
});
