"use client";

import { useEffect } from "react"; // ✅ useEffect 추가
import axios from "axios";
import { User } from "@/store/participantAtom";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";

interface HostManagerProps {
  TEST_MODE: boolean;
  TEST_USER_ID: string;
  setHostUser: (user: User | null) => void;
}

// ✅ 방장 정보를 가져오는 컴포넌트
export default function HostManager({ TEST_MODE, TEST_USER_ID, setHostUser }: HostManagerProps) {
  const { auth } = useAuth();
  console.log("🔍 useAuth에서 가져온 사용자 정보:", auth);

  useEffect(() => { // ✅ useEffect 추가
    if (TEST_MODE) {
      const testUser: User = {
        id: TEST_USER_ID,
        friendId: TEST_USER_ID,
        nickname: "테스트 방장",
        level: 1,
        ready: false,
        isHost: true,
      };
      setHostUser(testUser);
    } else {
      axios
        .get(`${API_BASE_URL}/users/me`, { withCredentials: true })
        .then((response) => {
          if (response.data) {
            const host: User = {
              id: response.data.id,
              friendId: response.data.id,
              nickname: response.data.nickname,
              level: response.data.level || 1,
              ready: false,
              isHost: true,
            };
            setHostUser(host);
          }
        })
        .catch((error) => {
          console.error("❌ 로그인한 유저 정보 가져오기 오류:", error);
          setHostUser(null);
        });
    }
  }, [TEST_MODE, TEST_USER_ID, setHostUser]); // ✅ 의존성 배열 확인

  return null; // ✅ UI 없이 로직만 실행
}
