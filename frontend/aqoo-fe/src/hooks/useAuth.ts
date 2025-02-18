// src/hooks/useAuth.ts

import { fetchUser as apiFetchUser, login as apiLogin, logout as apiLogout } from "@/services/authService";

import { authAtom } from "@/store/authAtom";
import { useRecoilState } from "recoil";

export const useAuth = () => {
  const [auth, setAuth] = useRecoilState(authAtom);

  /**
   * 로그인 함수 (일반 로그인)
   * - apiLogin 호출 후 반환된 데이터를 기반으로 accessToken과 사용자 정보를 Recoil 상태에 저장합니다.
   * - 일반 로그인인 경우 loginType을 "regular"로 설정합니다.
   */
  const login = async (id: string, pw: string): Promise<void> => {
    try {
      const user = await apiLogin(id, pw);
      const accessToken = localStorage.getItem("accessToken") || undefined;
      setAuth({
        isAuthenticated: true,
        user, // 반환받은 user 객체: { id, nickName }
        accessToken,
        loginType: "regular", // 일반 로그인임을 표시
      });
    } catch (error: any) {
      throw new Error(error.message || "로그인 중 오류가 발생했습니다.");
    }
  };

  /**
   * 로그아웃 함수
   * - apiLogout 호출 후 Recoil 상태를 초기화합니다.
   */
  const logout = async (): Promise<void> => {
    await apiLogout();
    setAuth({ isAuthenticated: false });
  };

  /**
   * 저장된 accessToken을 이용해 사용자 정보를 불러와 상태를 업데이트합니다.
   */
  const fetchUser = async (): Promise<void> => {
    const user = await apiFetchUser();
    if (user) {
      setAuth({
        isAuthenticated: true,
        user,
        accessToken: localStorage.getItem("accessToken") || undefined,
      });
    } else {
      setAuth({ isAuthenticated: false });
    }
  };

  /**
   * 소셜 로그인 함수
   * - 소셜 로그인 후 받은 accessToken, userId, nickName을 이용해 Recoil 상태와 localStorage를 업데이트합니다.
   */
  const socialLogin = (accessToken: string, userId: string, nickName: string): void => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("loggedInUser", userId);
    localStorage.setItem("nickName", nickName);
    setAuth({
      isAuthenticated: true,
      user: { id: userId, nickname: nickName },
      accessToken,
      loginType: "social", // 소셜 로그인임을 표시
    });
  };

  return { auth, login, logout, fetchUser, socialLogin };
};
