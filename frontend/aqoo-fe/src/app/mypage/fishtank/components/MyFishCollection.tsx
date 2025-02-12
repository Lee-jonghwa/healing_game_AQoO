"use client";

import { useState, useEffect } from "react";
import CollectionItemCard from "./CollectionItemCard";
import axiosInstance from "@/services/axiosInstance"; // 실제 경로에 맞게 조정하세요
import { useRecoilValue } from "recoil";
import { authAtom } from "@/store/authAtom";

interface MyFish {
  id: number;
  name: string;
  count: number;
  imageSrc: string;
}

export default function MyFishCollection() {
  // Recoil에서 현재 로그인한 유저 정보 가져오기
  const auth = useRecoilValue(authAtom);
  // 물고기 목록 상태
  const [myFishList, setMyFishList] = useState<MyFish[]>([]);

  useEffect(() => {
    // 유저 정보가 준비된 경우에만 API 요청 실행
    if (auth.user?.id) {
      axiosInstance
        .get(`/fish/my-fish/${auth.user.id}`)
        .then((response) => {
          // 응답 데이터 예시:
          // [
          //   { "fishTypeId": 1, "fishTypeName": "광어", "fishImage": "fish_url" },
          //   { "fishTypeId": 2, "fishTypeName": "상어", "fishImage": "fish_url" },
          //   { "fishTypeId": 3, "fishTypeName": "수박물고기", "fishImage": "fish_url" }
          // ]
          const fishes: MyFish[] = response.data.map((item: any) => ({
            id: item.fishTypeId,
            name: item.fishTypeName,
            // count 정보가 없는 경우 기본값 1로 설정 (필요 시 수정)
            count: 1,
            imageSrc: item.fishImage,
          }));
          setMyFishList(fishes);
        })
        .catch((error) => {
          console.error("Error fetching my fish collection:", error);
        });
    }
  }, [auth.user?.id]);

  return (
    <div className="bg-white w-full h-full rounded-[30px] p-3 overflow-auto">
      <div className="flex flex-wrap">
        {myFishList.map((fish) => (
          <CollectionItemCard
            key={fish.id}
            name={fish.name}
            count={fish.count}
            imageSrc={fish.imageSrc}
          />
        ))}
      </div>
    </div>
  );
}
