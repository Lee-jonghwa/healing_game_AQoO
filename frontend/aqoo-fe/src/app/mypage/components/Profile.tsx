"use client";
import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Fish } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  nickname: string;
  mainFishImage: string;
  level: number;
}

/**
 * Promise를 감싸서 Suspense에서 사용 가능한 객체를 반환하는 헬퍼 함수
 */
function wrapPromise<T>(promise: Promise<T>): { read(): T } {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  const suspender = promise.then(
    (r: T) => {
      status = "success";
      result = r;
    },
    (e: any) => {
      status = "error";
      result = e;
    }
  );
  return {
    read() {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
      throw new Error("Unexpected status");
    },
  };
}

/**
 * API에서 유저 정보를 불러오는 함수
 */
function fetchUserData(userId: string): Promise<any> {
  const token = localStorage.getItem("accessToken");
  const API_BASE_URL = "https://i12e203.p.ssafy.io";
  // const IMAGE_API_BASE_URL = "https://i12e203.p.ssafy.io/images";
  return fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (!response.ok) {
      throw new Error("유저 정보를 불러오는데 실패했습니다.");
    }
    return response.json().then((data) => {
      console.log("Fetched user data:", data);
      return data;
    });
  });
}

/**
 * 실제 UI를 렌더링하는 컴포넌트
 */
function ProfileContent({ userData, fishTotal }: { userData: UserData; fishTotal: number }) {
  return (
    <div
      className="
        m-2 w-full max-w-[90%] md:max-w-[1100px] lg:max-w-[1300px] 
        border-2 border-[#1c5e8d] rounded-[30px] bg-[#fffdfd]
        [box-shadow:-2px_-2px_0px_2px_rgba(0,0,0,0.25)_inset]
        flex justify-between items-center
        scale-90 sm:scale-95 md:scale-100
        transition-transform duration-300
      "
      style={{ aspectRatio: "6.5 / 1" }}
    >
      {/* 좌측: 초상화 + 레벨/닉네임/정보 */}
      <div className="flex gap-2 justify-center ml-2 p-3">
        {/* 초상화 컨테이너 */}
        <div
          className="
            max-w-[160px] md:max-w-[150px] lg:max-w-[170px]
            aspect-square flex-shrink-0
            flex items-center justify-center
            rounded-xl border border-black bg-white
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          "
        >
          {/* 실제 초상화 */}
          <div
            className="
              w-5/6 aspect-square flex-shrink-0
              flex items-center justify-center
              border border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]
            "
          >
            <img src={userData.mainFishImage} alt="대표 이미지" className="object-contain w-full h-full" />
          </div>
        </div>

        {/* 레벨/닉네임/총 물고기 등 텍스트 */}
        <div className="mx-3 flex flex-col justify-center w-full">
          <p
            className="
              px-4 flex items-center
              min-w-[300px] md:min-w-[280px] lg:min-w-[330px]
              h-10 md:h-9 lg:h-11
              flex-shrink-0 mt-2 mb-2 
              text-[#070707] text-center
              font-[400] leading-normal
              text-2xl sm:text-xl md:text-2xl
              rounded-xl border-[3px] border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.5)_inset]
            "
          >
            레벨: {userData.level}
          </p>
          <p
            className="
              min-w-[300px] md:min-w-[280px] lg:min-w-[330px] h-10 md:h-9 lg:h-11
              flex-shrink-0 mb-2 px-4 flex items-center
              text-[#070707] text-center text-2xl sm:text-xl md:text-2xl font-[400] leading-normal
              rounded-xl border-[3px] border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.5)_inset]
            "
          >
            닉네임: {userData.nickname}
          </p>
          <p
            className="
              min-w-[300px] md:min-w-[280px] lg:min-w-[330px] h-10 md:h-9 lg:h-11
              flex-shrink-0 mb-2 px-4
              flex items-center
              text-[#070707] text-center text-2xl sm:text-xl md:text-2xl font-[400] leading-normal
              rounded-xl border-[3px] border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.5)_inset]
            "
          >
            총 물고기 갯수: {fishTotal} 마리
          </p>
        </div>
      </div>

      {/* 우측: 회원정보수정 버튼 */}
      <div className="self-start m-2 mr-5">
        <Link
          href="/mypage/edit"
          className="
            min-w-[80px] h-10 px-2
            rounded-xl border border-[#040303] bg-white 
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
            flex items-center justify-center
            text-[#070707] text-center font-[400] text-2xl sm:text-xl md:text-2xl
          "
        >
          회원정보수정
        </Link>
      </div>
    </div>
  );
}

/**
 * Profile 컴포넌트는 auth.user가 준비되었을 때,
 * useState와 useEffect를 사용해 리소스를 한 번만 생성합니다.
 */
function Profile({ fishTotal }: { fishTotal: number }) {
  const { auth } = useAuth();
  const userId = auth.user?.id;
  const [resource, setResource] = useState<{ read: () => any } | null>(null);

  useEffect(() => {
    if (userId && !resource) {
      setResource(wrapPromise(fetchUserData(userId)));
    }
  }, [userId, resource]);

  if (!auth.user || !resource) {
    console.log(`auth.user: ${auth.user}`);
    console.log(`resource: ${resource}`);
    return <div>로딩 중...</div>;
  }

  const userData = resource.read();
  return <ProfileContent userData={userData} fishTotal={fishTotal} />;
}

/**
 * Suspense를 사용해 로딩 상태를 처리하는 Wrapper 컴포넌트
 */
export default function ProfileWrapper({ fishTotal }: { fishTotal: number }) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <Profile fishTotal={fishTotal} />
    </Suspense>
  );
}
