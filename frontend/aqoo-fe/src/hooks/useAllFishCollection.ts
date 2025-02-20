"use client";

// ✅ 테스트용 훅 (Auth 없이 전체 물고기 도감 가져옴)
import { useEffect, useState } from "react";
import { fetchAllFishCollectionTest } from "@/lib/api";

interface FishData {
  id: number;
  fishName: string;
  imageUrl: string;
  rarity: string;
}

/**
 * 테스트용 커스텀 훅 (로그인 없이 전체 물고기 종류 가져옴)
 */
export function useAllFishCollectionTest() {
  const [fishList, setFishList] = useState<FishData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFish() {
      console.log("🟡 useAllFishCollectionTest: API 호출 시작");

      try {
        const data = await fetchAllFishCollectionTest();

        // console.log("🟢 useAllFishCollectionTest: API 응답 데이터", data); // ✅ API 응답 로그

        if (data) {
          setFishList(data);
        } else {
          throw new Error("전체 물고기 데이터를 올바르게 가져오지 못했습니다.");
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
