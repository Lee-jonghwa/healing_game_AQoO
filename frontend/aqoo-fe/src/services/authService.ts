// src/services/authService.ts
import axios from "axios";
import { User } from "@/store/authAtom";

const AUTH_API_URL = "https://i12e203.p.ssafy.io/api/v1/auth";
const USER_API_URL = "https://i12e203.p.ssafy.io/api/v1/users";

/**
 * 로그인 API 호출
 * - 요청 시 id와 pw를 전송합니다.
 * - 응답 JSON 본문에서 accessToken을 추출해 localStorage에 저장합니다.
 * - 로그인 성공 시 입력받은 id 값을 사용자 식별자로 사용하여 User 객체를 반환합니다.
 */
export const login = async (id: string, pw: string): Promise<User> => {
  try {
    const res = await axios.post(
      `${AUTH_API_URL}/login`,
      { id, pw },
      { withCredentials: true }
    );

    // 응답 JSON 본문에서 accessToken, userId, nickName 추출
    const { accessToken, userId, nickName } = res.data;
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }

    // 로그인 성공 시 userId를 로컬에 저장
    localStorage.setItem("loggedInUser", userId);

    // 추가 사용자 정보가 없다면, 입력받은 id로 User 객체 생성하여 반환합니다.
    return { id, nickName };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "로그인 실패");
  }
};

/**
 * 로그아웃 API 호출
 * - 서버에 로그아웃 요청을 보내고, localStorage에 저장된 인증 정보를 삭제합니다.
 * - 엔드포인트는 /logout/{userId} 형태로 호출합니다.
 */
export const logout = async (): Promise<void> => {
  try {
    const userId = localStorage.getItem("loggedInUser");
    if (!userId) {
      // userId가 없으면 인증 관련 데이터를 정리 후 종료
      localStorage.removeItem("accessToken");
      localStorage.removeItem("loggedInUser");
      return;
    }

    // userId를 포함한 로그아웃 엔드포인트 호출 (withCredentials 옵션 포함)
    await axios.delete(`${AUTH_API_URL}/logout/${userId}`, { withCredentials: true });
    
    // 로그아웃 성공 시 localStorage의 인증 데이터 삭제
    localStorage.removeItem("accessToken");
    localStorage.removeItem("loggedInUser");
  } catch (error: any) {
    console.error("Error during logout:", error);
  }
};


/**
 * 저장된 accessToken을 이용해 로그인된 사용자 정보를 가져옵니다.
 */
export const fetchUser = async (): Promise<User | null> => {
  const token = localStorage.getItem("accessToken");
  const storedId = localStorage.getItem("loggedInUser");
  if (!token || !storedId) return null;

  try {
    const res = await axios.get(`${USER_API_URL}/${storedId}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
