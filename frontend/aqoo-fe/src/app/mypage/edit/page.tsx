"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";

import InputField from "./InputField";
import ModalButtons from "./ModalButtons";
import Buttons from "./Buttons";
import PasswordChangeModal from "./PasswordChangeModal";
import DeleteAccountModal from "./DeleteAccountModal";
import MyFishChangeModal from "./MyFishChangeModal";

interface ProfileFormInputs {
  nickname: string;
}

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
}: {
  userData: {
    id: string;
    email: string;
    nickname: string;
    mainFishImage: string;
  } | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isLoading: boolean;
  register: any;
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
              register={register("nickname", { required: true })}
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMyFishModalOpen, setIsMyFishModalOpen] = useState(false);
  const SERVER_API = "https://i12e203.p.ssafy.io";

  // useRef를 사용하여 리소스를 한 번만 생성하고 재사용합니다.
  const userDataResourceRef = useRef<{ read: () => any } | null>(null);

  useEffect(() => {
    // auth.user?.id가 준비되었고, 아직 리소스가 생성되지 않았다면 생성합니다.
    if (!userDataResourceRef.current && auth.user?.id) {
      const token = localStorage.getItem("accessToken");
      userDataResourceRef.current = wrapPromise(
        fetch(`${SERVER_API}/api/v1/users/${auth.user.id}`, {
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
  }, [auth.user?.id]); // auth.user?.id가 변경될 때만 이 effect가 실행됩니다.

  // Suspense 내부에서 호출 (리소스가 준비되지 않았다면 Promise를 throw하여 fallback 표시)
  const userData = userDataResourceRef.current ? userDataResourceRef.current.read() : null;

  useEffect(() => {
    if (userData) {
      setValue("nickname", userData.nickname || "");
    }
  }, [userData, setValue]);

  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${SERVER_API}/api/v1/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userData?.id || "",
          nickname: data.nickname,
          mainFishImage: userData?.mainFishImage || "",
        }),
      });

      if (!response.ok) {
        throw new Error("회원 정보 수정 실패");
      }

      await fetchUser();
      alert("회원 정보 수정 성공!");
      router.push("/profile");
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
            <div className="w-[220px] h-[220px] flex-shrink-0 flex items-center justify-center rounded-xl border border-black bg-white [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]">
              {userData?.mainFishImage ? (
                <Image
                  src={userData.mainFishImage}
                  alt="대표 물고기"
                  className="w-24 h-24 object-cover rounded-md"
                  width={200}
                  height={200}
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
      {isMyFishModalOpen && <MyFishChangeModal onClose={() => setIsMyFishModalOpen(false)}
      userData={userData} />}
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
