"use client";

import React, { useEffect, useState } from "react";
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

interface ProfileFormInputs {
  nickname: string;
}

export default function EditProfilePage() {
  // const { auth } = useAuth();
  const { register, handleSubmit, setValue } = useForm<ProfileFormInputs>();
  const { fetchUser, auth } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<{
    id: string;
    email: string;
    nickname: string;
    mainFishImage: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMyFishModalOpen, setIsMyFishModalOpen] = useState(false);
  const SERVER_API = "https://i12e203.p.ssafy.io";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${SERVER_API}/api/v1/users/${auth.user?.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.log(auth);
          console.log(`사용자: ${auth.user?.id}`);
          throw new Error("유저 정보를 불러오는데 실패했습니다.");
        }

        const user = await response.json();
        setUserData(user);
        setValue("nickname", user.nickname || "");
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUserData();
  }, [setValue]);

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
        console.log(data);
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
    // test
  };

  return (
    <div
      className="
        flex 
        h-screen 
        bg-[url('/images/배경샘플.png')] 
        bg-cover bg-center bg-no-repeat
        relative
        justify-center
        "
    >
      {/* 버튼 위치 지정 */}
      <div className="absolute top-0 left-0 m-2">
        <Buttons text="BACK" />
      </div>
      {/* <div className="absolute bottom-0 right-0 m-2">
        <Buttons text="완료" />
      </div> */}

      <div
        className="
          flex justify-center items-center
          h-screen w-screen bg-cover bg-center
        "
      >
        <div className="flex-1 flex flex-col items-center">
          <div
            className="
                  w-[250px] h-[250px] flex-shrink-0
                  flex items-center justify-center
                  rounded-xl border border-black bg-white
                  [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
                  mb-10
                "
          >
            {/* 실제 초상화 */}
            <div
              className="
                      w-[220px] h-[220px] flex-shrink-0
                      flex items-center justify-center
                      rounded-xl border border-black bg-white
                      [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]
                    "
            >
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {isPasswordModalOpen && <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />}
              {isDeleteModalOpen && <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} />}
              {isMyFishModalOpen && <MyFishChangeModal onClose={() => setIsMyFishModalOpen(false)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
