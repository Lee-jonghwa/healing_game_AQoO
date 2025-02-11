"use client";

// ✅ 테스트용 훅 (Auth 없이 임의 userId 사용)
import { useEffect, useState } from "react";
import { fetchCustomFishCollectionTest } from "@/lib/api";

interface FishData {
  fishTypeId: number;
  fishTypeName: string;
  fishImage: string;
}

/**
 * 테스트용 커스텀 훅 (로그인 없이 특정 userId의 커스텀 물고기를 가져옴)
 */
export function useCustomFishCollectionTest() {
  const [fishList, setFishList] = useState<FishData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFish() {
      try {
        const data = await fetchCustomFishCollectionTest();
        if (data) {
          setFishList(data);
        } else {
          setError(new Error("물고기 커스텀 데이터를 불러오지 못했습니다."));
        }
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFish();
  }, []);

  return { fishList, isLoading, error };
}
