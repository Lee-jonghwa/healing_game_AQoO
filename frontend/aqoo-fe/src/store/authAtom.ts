import { atom } from "recoil";
import { recoilPersist } from 'recoil-persist';



const { persistAtom } = recoilPersist();

export interface User {
  id: string;
  nickName: string;
  // 필요에 따라 name, email, 기타 필드를 추가할 수 있습니다.
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
