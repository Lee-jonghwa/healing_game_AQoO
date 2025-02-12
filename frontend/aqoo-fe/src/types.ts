export interface UserInfo {
  id: string;
  nickname: string;
  level: number;
  exp: number;
  mainAquarium: number;
  fishTicket: number;
}

// 🔹 어항 상태 데이터 타입 정의
export interface AquariumData {
  id: number;
  aquariumName: string;
  waterStatus: number;
  pollutionStatus: number;
  feedStatus: number;
}

// 친구 데이터 타입
export interface Friend {
  id: number; // 친구 관계 ID
  friendId: string; // 친구 유저 ID
  nickname: string; // 친구 닉네임
  level: number; // 친구 레벨
  mainFishImage: string | null; // 친구 메인 물고기 이미지
}

// 검색 결과 데이터 타입
export interface SearchUser {
  userId: string; // 검색한 사용자 ID
  friendId: string; // 검색된 친구 ID
  isFriend: number; // 0 (친구 아님) / 1 (친구임)
  nickname: string; // 닉네임
  level: number; // 레벨
  mainFishImage: string | null; // 대표 물고기 이미지 (없으면 null)
}

export interface Notification {
  id: number;
  userId: string;
  type: string;
  data?: string;
  message: string;
  status: boolean;
  createdAt: string;
}

export interface ProfileFormInputs {
  nickname: string;
}
