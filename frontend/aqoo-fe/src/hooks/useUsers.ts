// hooks/useUers.ts
// 나중에 채팅방 / 실시간 게임 참가자 관리하는 용으로 파놓음 아직 코드 완성 Xx라 수정해야할 듯

import { User } from "@/store/authAtom";
import { getUsers } from "@/services/userService";
import { useQuery } from "@tanstack/react-query";

// 참가자들(사용자, 유저) 리스트 받아오기
export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: getUsers,
    staleTime: 1000 * 60 * 5, // 5분 동안 캐싱 유지
  });
};
