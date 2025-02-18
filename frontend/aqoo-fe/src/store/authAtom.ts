import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export interface User {
  id: string;
  nickname: string;
  email?: string;
  mainFishImage?: string;
  exp?: number;
  level?: number;
  status?: boolean;
  mainAquarium?: number; // mainAquarium 속성 추가
  fishTicket?: number;
  isFirstLogin?: number;
}


export interface AuthState {
  isAuthenticated: boolean;
  user?: User;
  accessToken?: string;
  // 로그인 방식 정보를 추가 (소셜 로그인 vs 일반 로그인)
  loginType?: "social" | "regular";
  // refreshToken은 보안상 쿠키로 관리하므로 store에 저장하지 않습니다.
}

export const authAtom = atom<AuthState>({
  key: "authAtom",
  default: { isAuthenticated: false },
  effects_UNSTABLE: [persistAtom],
});
