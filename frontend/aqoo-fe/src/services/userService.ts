import { User } from "@/store/authAtom";
import axios from "axios";

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

/**
 * 🔹 유저 경험치 증가 함수
 * @param userId 유저 ID
 * @param earnedExp 획득한 경험치량
 * @returns 업데이트된 유저 경험치 & 레벨 정보
 */
export const increaseUserExp = async (userId: string, earnedExp: number) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/exp-up`, {
      userId,
      earnedExp,
    });

    console.log("✅ 경험치 증가 성공:", response.data);
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
