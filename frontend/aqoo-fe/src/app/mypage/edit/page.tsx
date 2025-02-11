"use client";

import React, { Suspense, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

import InputField from "./InputField";
import ModalButtons from "./ModalButtons";
import Buttons from "./Buttons";
import PasswordChangeModal from "./PasswordChangeModal";
import DeleteAccountModal from "./DeleteAccountModal";
import MyFishChangeModal from "./MyFishChangeModal";

import Image from "next/image";
import axiosInstance from "@/services/axiosInstance";

// 사용자 정보 타입 정의
interface ProfileFormInputs {
  nickname: string;
}

interface UserData {
  id: string;
  email: string;
  nickname: string;
  mainFishImage: string;
}

// Suspense 지원을 위한 wrapPromise 함수
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
      throw new Error("Unexpected state");
    },
  };
}

// 사용자 정보를 패칭하는 함수 (axiosInstance 사용)
// GET 요청 시 withCredentials 옵션을 false로 하여 preflight 문제 회피
function fetchUserData(userId: string | undefined): Promise<UserData> {
  if (!userId) {
    return Promise.reject(new Error("User is not authenticated"));
  }
  return axiosInstance.get(`/users/${userId}`, { withCredentials: false }).then((response) => response.data);
}

// Suspense를 위한 데이터 패칭 훅
function useUserData() {
  const { auth } = useAuth();
  const [resource] = useState(() => wrapPromise(fetchUserData(auth.user?.id)));
  return resource.read();
}

// Suspense 로딩 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

// 회원 정보 수정 페이지
function EditProfilePage() {
  const { register, handleSubmit, setValue } = useForm<ProfileFormInputs>();
  const { fetchUser } = useAuth();
  const router = useRouter();

  // Suspense 내부에서 사용자 데이터 가져오기
  const userData: UserData = useUserData();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMyFishModalOpen, setIsMyFishModalOpen] = useState(false);

  React.useEffect(() => {
    if (userData) {
      setValue("nickname", userData.nickname || "");
    }
  }, [userData, setValue]);

  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    setIsProcessing(true);
    try {
      // axiosInstance 인터셉터가 토큰을 헤더에 자동 추가하므로 POST 요청에 별도 옵션 없이 사용
      await axiosInstance.post("/users", {
        id: userData?.id || "",
        nickname: data.nickname,
        mainFishImage: userData?.mainFishImage || "",
      });
      await fetchUser();
      alert("회원 정보 수정 성공!");
      router.push("/profile");
    } catch (error) {
      alert("회원 정보 수정 실패");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[url('/images/배경샘플.png')] bg-cover bg-center bg-no-repeat relative justify-center">
      {/* 뒤로가기 버튼 */}
      <div className="absolute top-0 left-0 m-2">
        <Buttons text="BACK" />
      </div>

      <div className="flex justify-center items-center h-screen w-screen bg-cover bg-center">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-[250px] h-[250px] flex-shrink-0 flex items-center justify-center rounded-xl border border-black bg-white mb-10">
            <div className="w-[220px] h-[220px] flex-shrink-0 flex items-center justify-center rounded-xl border border-black bg-white">
              {userData?.mainFishImage ? (
                <Image src={userData.mainFishImage} alt="대표 물고기" width={200} height={200} />
              ) : (
                <p className="text-gray-500">이미지가 없습니다.</p>
              )}
            </div>
          </div>
          <ModalButtons
            text="대표 물고기 변경"
            isLoading={isProcessing}
            color="none"
            onClick={() => setIsMyFishModalOpen(true)}
            isSpecial
          />
        </div>

        <div className="flex-1">
          <div className="bg-white p-8 rounded-2xl shadow-lg w-[450px]">
            <h2 className="text-center text-3xl mb-6">회원정보 수정</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <InputField label="아이디" placeholder={userData?.id || "로딩 중..."} variant="static" />
                <InputField label="이메일" placeholder={userData?.email || "로딩 중..."} variant="static" />
                <InputField
                  label="닉네임"
                  placeholder={userData?.nickname || "닉네임 입력"}
                  register={register("nickname", { required: true })}
                  variant="nickname"
                />
              </div>
            </form>
            <div className="flex justify-between gap-4 mt-4">
              <ModalButtons
                text="비밀번호 변경"
                isLoading={isProcessing}
                color="blue"
                onClick={() => setIsPasswordModalOpen(true)}
              />
              <ModalButtons
                text="회원 탈퇴"
                isLoading={isProcessing}
                color="red"
                onClick={() => setIsDeleteModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense 적용 (서버 빌드 오류 해결)
export default function EditProfilePageWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EditProfilePage />
    </Suspense>
  );
}
