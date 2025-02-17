"use client";

// ✅ 테스트용 훅 (Auth 없이 임의 userId 사용)
import { useEffect, useState } from "react";
import { fetchUserFishCollectionTest } from "@/lib/api";

interface FishData {
  fishTypeId: number;
  fishTypeName: string;
  fishImage: string;
  rarity: string;
  cnt: number;
}

/**
 * 테스트용 커스텀 훅 (로그인 없이 특정 userId의 물고기 도감을 가져옴)
 */
export function useUserFishCollectionTest(userId?: string) {
  const [fishList, setFishList] = useState<FishData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    const validUserId: string = userId;

    async function loadFish() {
      try {
        const data = await fetchUserFishCollectionTest(validUserId);
        if (data) {
          setFishList(data);
        } else {
          setError(new Error("물고기 도감 데이터를 불러오지 못했습니다."));
        }
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFish();
  }, [userId]);

  return { fishList, isLoading, error };
}
