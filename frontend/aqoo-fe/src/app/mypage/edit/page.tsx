"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useForm, SubmitHandler, UseFormRegister, UseFormSetValue, UseFormHandleSubmit } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useRecoilState } from "recoil";
import { authAtom } from "@/store/authAtom";

import InputField from "./InputField";
import ModalButtons from "./ModalButtons";
import Buttons from "./Buttons";
import PasswordChangeModal from "./PasswordChangeModal";
import DeleteAccountModal from "./DeleteAccountModal";
import MyFishChangeModal from "./MyFishChangeModal";

import { ProfileFormInputs } from "@/types";

/**
 * Suspense 리소스를 위한 헬퍼 함수
 * Promise의 상태에 따라 .read() 호출 시 데이터를 반환하거나,
 * 아직 준비 중이면 Promise를 throw합니다.
 */
function wrapPromise<T>(promise: Promise<T>) {
  let status: "pending" | "success" | "error" = "pending";
  let result: T;
  const suspender = promise.then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    }
  );
  return {
    read(): T {
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

function ProfileForm({
  userData,
  onSubmit,
  isLoading,
  register,
  setValue,
  handleSubmit,
}: {
  userData: {
    id: string;
    email: string;
    nickname: string;
    mainFishImage: string;
  } | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isLoading: boolean;
  register: UseFormRegister<ProfileFormInputs>; // ✅ 올바른 타입 지정
  setValue: UseFormSetValue<ProfileFormInputs>; // ✅ 올바른 타입 지정
  handleSubmit: UseFormHandleSubmit<ProfileFormInputs>;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <InputField label="아이디" placeholder={userData?.id || "로딩 중..."} variant="static" />
        <InputField label="이메일" placeholder={userData?.email || "로딩 중..."} variant="static" />
        <div className="flex items-end justify-between gap-4 relative">
          <div className="relative w-full">
            <InputField
              label="닉네임"
              placeholder={userData?.nickname || "닉네임 입력"}
              // variant가 nickname -> useNickNameEdit 훅 사용
              register={register("nickname", { required: true })}
              setValue={setValue}
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
              variant="nickname"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

function EditProfilePage() {
  const { register, handleSubmit, setValue } = useForm<ProfileFormInputs>();
  const { fetchUser, auth } = useAuth();
  const [authState, setAuthState] = useRecoilState(authAtom);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMyFishModalOpen, setIsMyFishModalOpen] = useState(false);
  const API_BASE_URL = "https://i12e203.p.ssafy.io";

  // userData 리소스: auth.user가 변경될 때마다 최신 데이터를 가져옴
  const userDataResourceRef = useRef<{ read: () => any } | null>(null);

  useEffect(() => {
    // auth.user?.id가 준비되었고, 아직 리소스가 생성되지 않았다면 생성
    if (auth.user?.id) {
      const token = localStorage.getItem("accessToken");
      userDataResourceRef.current = wrapPromise(
        fetch(`${API_BASE_URL}/api/v1/users/${auth.user.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).then((response) => {
          if (!response.ok) {
            throw new Error("유저 정보를 불러오는데 실패했습니다.");
          }
          return response.json();
        })
      );
    }
  }, [auth.user]); // auth.user가 변경될 때마다 리소스 재생성

  // Suspense 내부에서 호출 (리소스가 준비되지 않았다면 Promise를 throw하여 fallback 표시)
  const userData = userDataResourceRef.current ? userDataResourceRef.current.read() : null;

  useEffect(() => {
    if (userData) {
      setValue("nickname", userData.nickname || "");
    }
  }, [userData, setValue]);

  // 닉네임 수정 이벤트 핸들러, optimistic update 적용
  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      console.log("닉네임 입력값:", data.nickname);
      const token = localStorage.getItem("accessToken");

      const parsedImageName = "/" + userData?.mainFishImage.split("/").pop() || "";

      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userData?.id || "",
          userNickName: data.nickname,
          mainFishImage: parsedImageName,
        }),
      });

      const responseData = await response.json();
      console.log("API 응답 상태:", response.status);
      console.log("API 응답 데이터:", responseData);

      if (!response.ok) {
        throw new Error(`회원 정보 수정 실패: ${responseData.message || "알 수 없는 오류"}`);
      }

      // 최신 유저데이터를 불러와서 recoil 상태 업데이트
      await fetchUser();
      // optimistic update: 전역 auth 상태에서 nickname 변경

      // Recoil의 상태 업데이트 방식은 비동기적(Asynchronous)이며, 최신 상태를 보장하지 않음
      // 즉, setAuthState(authState => { ...authState, user: { ...authState.user, nickName: data.nickname } })를 호출해도
      // authState가 최신 상태가 아닐 가능성이 있음
      // 기존 값이 덮어씌워지는 경우가 발생할 수 있음
      setAuthState(
        (prevState) =>
          ({
            ...prevState,
            user: {
              ...prevState.user,
              nickName: data.nickname,
            },
          } as any)
      );

      alert("회원 정보 수정 성공!");
      router.push("/mypage/edit");
    } catch (error) {
      alert("회원 정보 수정 실패");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[url('/images/배경샘플.png')] bg-cover bg-center bg-no-repeat relative justify-center">
      <div className="absolute top-0 left-0 m-2">
        <Buttons text="BACK" />
      </div>

      <div className="flex justify-center items-center h-screen w-screen bg-cover bg-center">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-[250px] h-[250px] flex-shrink-0 flex items-center justify-center rounded-xl border border-black bg-white [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset] mb-10">
            <div className="overflow-hidden w-[220px] h-[220px] flex-shrink-0 flex items-center justify-center rounded-xl border border-black bg-white [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]">
              {userData?.mainFishImage ? (
                <Image
                  src={
                    // 만약 mainFishImage가 전체 URL이 아니라 파일명만 있다면 기본 URL 붙임
                    userData.mainFishImage.startsWith("http")
                      ? userData.mainFishImage
                      : `images/${userData.mainFishImage}`
                  }
                  alt="대표 물고기"
                  className="max-w-full max-h-full object-cover"
                  width={220}
                  height={220}
                />
              ) : (
                <p className="text-gray-500">로딩 중...</p>
              )}
            </div>
          </div>
          <ModalButtons
            text="대표 물고기 변경"
            isLoading={isLoading}
            color="none"
            onClick={() => setIsMyFishModalOpen(true)}
            isSpecial={true}
          />
        </div>

        <div className="flex-1">
          <div className="bg-white p-8 rounded-2xl shadow-lg w-[450px]">
            <h2 className="text-center text-3xl mb-6">회원정보 수정</h2>
            <ProfileForm
              userData={userData}
              onSubmit={handleSubmit(onSubmit)}
              isLoading={isLoading}
              register={register}
              setValue={setValue}
              handleSubmit={handleSubmit}
            />
            <div className="flex justify-between gap-4 mt-4">
              <ModalButtons
                text="비밀번호 변경"
                isLoading={isLoading}
                color="blue"
                onClick={() => setIsPasswordModalOpen(true)}
              />
              <ModalButtons
                text="회원 탈퇴"
                isLoading={isLoading}
                color="red"
                onClick={() => setIsDeleteModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />}
      {isDeleteModalOpen && <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} />}
      {isMyFishModalOpen && <MyFishChangeModal onClose={() => setIsMyFishModalOpen(false)} userData={userData} />}
    </div>
  );
}

export default function EditProfilePageWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditProfilePage />
    </Suspense>
  );
}
