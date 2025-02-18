import { User } from "@/store/authAtom";
import axios from "axios";
import axiosInstance from "@/services/axiosInstance";

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

/**
 * 🔹 유저 경험치 증가 함수
 * @param userId 유저 ID
 * @param earnedExp 획득한 경험치량
 * @returns 업데이트된 유저 경험치 & 레벨 정보
 */
export const increaseUserExp = async (userId: string, earnedExp: number) => {
  try {
    const response = await axiosInstance.post(`/users/exp-up`, {
      userId,
      earnedExp,
    });

    return response.data; // { curExp, expToNextLevel, expProgress, userLevel }
  } catch (error) {
    console.error("❌ 경험치 증가 실패", error);
    return null;
  }
};

// 테스트용 더미 API
const API_URL = "https://jsonplaceholder.typicode.com/users"; // ✅ 더미 API

// ✅ 반환 타입을 User[]로 명확히 지정
export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

/**
 * 🔹 물고기 티켓 증가 함수
 * @param userId 유저 ID
 * @returns 증가된 물고기 티켓 수
 */
export const increaseFishTicket = async (userId: string) => {
  try {
    const response = await axiosInstance.get(`/fish/ticket/${userId}`, {
      withCredentials: true,
    });

    return response.data.fishTicket; // ✅ 증가된 물고기 티켓 수 반환
  } catch (error) {
    console.error("❌ 물고기 티켓 증가 실패", error);
    return null;
  }
};
