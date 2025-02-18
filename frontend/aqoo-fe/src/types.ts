export interface UserInfo {
  id: string;
  nickname: string;
  level: number;
  exp: number;
  mainAquarium: number;
  fishTicket: number;
  email: string;
  mainFishImage: string;
  status: boolean;
}

// 🔹 어항 상태 데이터 타입 정의
export interface AquariumData {
  id: number;
  aquariumName: string;
  waterStatus: number;
  pollutionStatus: number;
  feedStatus: number;
  aquariumBackground: string;
}

// 친구 데이터 타입
export interface Friend {
  id: number; // 친구 관계 ID
  friendId: string; // 친구 유저 ID
  nickname: string; // 친구 닉네임
  level: number; // 친구 레벨
  mainFishImage: string; // 친구 메인 물고기 이미지
}

// 검색 결과 데이터 타입
export interface SearchUser {
  userId: string; // 검색한 사용자 ID
  friendId: string; // 검색된 친구 ID
  isFriend: number; // 0 (친구 아님) / 1 (친구임)
  nickname: string; // 닉네임
  level: number; // 레벨
  mainFishImage: string; // 대표 물고기 이미지 (없으면 null)
}

export interface Notification {
  id: number;
  userId: string;
  type: string;
  data: string;
  message: string;
  status: boolean;
  createdAt: string;
}

// 닉네임 변경 위한 프로필 폼 타입
export interface ProfileFormInputs {
  nickname: string;
}

// 유저 정보 타입
export interface UserData {
  id: string;
  email: string;
  nickname: string;
  mainFishImage: string;
}

export interface GotchaFish {
  userFishId: number;
  fishTypeId: number;
  fishName: string;
  rarity: "COMMON" | "RARE" | "EPIC";
  imageUrl: string;
}

export interface AquariumListItem {
  id: number;
  aquariumName: string;
  // 필요에 따라 추가 정보(예, 기본 배경 URL 등)를 포함할 수 있음.
}
