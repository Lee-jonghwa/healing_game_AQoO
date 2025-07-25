"use client";

import { AquariumData, UserInfo } from "@/types";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { SubmitHandler, UseFormHandleSubmit, UseFormRegister, UseFormSetValue, useForm } from "react-hook-form";

import { AxiosResponse } from "axios";
import Buttons from "./Buttons";
import DeleteAccountModal from "./DeleteAccountModal";
import Image from "next/image";
import InputField from "./InputField";
import ModalButtons from "./ModalButtons";
import MyFishChangeModal from "./MyFishChangeModal";
import PasswordChangeModal from "./PasswordChangeModal";
import { ProfileFormInputs } from "@/types";
import { authAtom } from "@/store/authAtom";
import axiosInstance from "@/services/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import { useRecoilState } from "recoil";
import { useRouter } from "next/navigation";
import { useSFX } from "@/hooks/useSFX";
import { useToast } from "@/hooks/useToast";

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
  onSubmit: SubmitHandler<ProfileFormInputs>;
  isLoading: boolean;
  register: UseFormRegister<ProfileFormInputs>;
  setValue: UseFormSetValue<ProfileFormInputs>;
  handleSubmit: UseFormHandleSubmit<ProfileFormInputs>;
}) {
  const { showToast } = useToast();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      <div className="flex flex-col gap-1 sm:gap-4 ">
        <InputField label="아이디" placeholder={userData?.id || "로딩 중..."} variant="static" />
        <InputField label="이메일" placeholder={userData?.email || "로딩 중..."} variant="static" />
        <div className="flex items-end justify-between sm:gap-4 relative">
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
  const [background, setBackground] = useState("/background-1.png");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [aquariumData, setAquariumData] = useState<AquariumData | null>(null);

  const API_BASE_URL = "https://i12e203.p.ssafy.io";

  // userData 리소스: auth.user가 변경될 때마다 최신 데이터를 가져옴
  const userDataResourceRef = useRef<{ read: () => any } | null>(null);
  const [userDataResource, setUserDataResource] = useState<{ read: () => any } | null>(null);

  const { showToast } = useToast();

  const { play: playClick } = useSFX("/sounds/pop-01.mp3");

  const wrapOnClick = (originalOnClick?: () => void) => () => {
    playClick();
    if (originalOnClick) {
      originalOnClick();
    }
  };

  // 접속 유저의 정보 조회
  useEffect(() => {
    if (!auth.user?.id) return;
    axiosInstance
      .get(`/users/${auth.user.id}`)
      .then((response: AxiosResponse<UserInfo>) => {
        // console.log("✅ 유저 정보:", response.data);
        setUserInfo(response.data);
      })
      .catch((error) => {
        // console.error("❌ 유저 정보 불러오기 실패", error);
      });
  }, [auth.user?.id]);

  // 어항 상세 정보 및 배경 정보 조회
  useEffect(() => {
    // console.log("Fetching aquarium data...");
    if (!userInfo?.mainAquarium) return;

    // console.log("🐠 메인 아쿠아리움 ID:", userInfo.mainAquarium);

    axiosInstance.get(`/aquariums/${userInfo.mainAquarium}`).then((res: AxiosResponse<AquariumData>) => {
      // console.log("✅ 어항 상세 정보:", res.data);
      setAquariumData(res.data);

      const BACKGROUND_BASE_URL = "https://i12e203.p.ssafy.io/images";

      let bgUrl = res.data.aquariumBackground;
      if (!bgUrl) return;

      if (!bgUrl.startsWith("http")) {
        bgUrl = `${BACKGROUND_BASE_URL}/${bgUrl.replace(/^\/+/, "")}`;
      }
      // console.log("Setting background to:", bgUrl);
      setBackground(bgUrl);
    });
    // .catch((err) => console.error("❌ 어항 정보 불러오기 실패", err));
  }, [userInfo]);

  // userData 리소스 생성: auth.user?.id가 준비되면 axiosInstance로 데이터 가져오기
  useEffect(() => {
    if (auth.user?.id) {
      const token = localStorage.getItem("accessToken");
      const resource = wrapPromise(
        axiosInstance
          .get(`/users/${auth.user.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
          .then((response) => response.data)
      );
      setUserDataResource(resource);
    }
  }, [auth.user]);

  // Suspense 내부에서 호출 (리소스가 준비되지 않았다면 Promise를 throw하여 fallback 표시)
  // 렌더 시점에 바로 읽기
  const userData = userDataResource ? userDataResource.read() : null;
  useEffect(() => {
    if (userData) {
      setValue("nickname", userData.nickname || "");
    }
  }, [userData, setValue]);

  // 닉네임 수정 이벤트 핸들러, optimistic update 적용
  const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      // console.log("닉네임 입력값:", data.nickname);
      const token = localStorage.getItem("accessToken");

      const parsedImageName = "/" + (userData?.mainFishImage.split("/").pop() || "");

      const response = await axiosInstance.post(
        `/users`,
        {
          userId: userData?.id || "",
          userNickName: data.nickname,
          mainFishImage: parsedImageName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // console.log("API 응답 상태:", response.status);
      // console.log("API 응답 데이터:", response.data);

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`회원 정보 수정 실패: ${response.data.message || "알 수 없는 오류"}`);
      }

      // 최신 유저데이터를 불러와서 recoil 상태 업데이트
      await fetchUser();
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

      showToast("회원 정보 수정 성공!", "success");
      router.push("/mypage/edit");
    } catch (error) {
      showToast("회원 정보 수정 실패", "error");
      // console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${background})`,
      }}
      className="
        bg-cover bg-center bg-no-repeat
        h-screen w-screen overflow-hidden
        relative"
    >
      <div className="absolute bottom-5 right-5">
        <Buttons text="BACK" />
      </div>

      {/* 전체 감싸기 */}
      <div className="mt-20 sm:mt-0 flex flex-col sm:flex-row justify-center items-center h-screen w-screen">
        {/* 대표물고기 이미지 */}
        <div className="sm:mt-0 sm:flex-1 flex flex-col items-center">
          <div
            className="w-1/2 sm:w-[250px] h-auto aspect-square
          flex-shrink-0 flex items-center justify-center
          rounded-xl border border-black bg-white
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          mb-2 sm:mb-10"
          >
            <div className="overflow-hidden w-[90%] h-auto aspect-square flex-shrink-0 flex items-center justify-center rounded-xl border border-black bg-white [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]">
              {userData?.mainFishImage ? (
                <img
                  src={
                    userData.mainFishImage !== `${API_BASE_URL}/images/fish.png`
                      ? userData.mainFishImage
                      : `${API_BASE_URL}/images/미등록이미지.png`
                  }
                  alt="대표 물고기"
                  className="max-w-full max-h-full object-cover object-contain"
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
            onClick={wrapOnClick(() => setIsMyFishModalOpen(true))}
            isSpecial={true}
          />
        </div>

        <div className="flex-1 w-[80%] mt-5 sm:mt-0">
          <div
            className="
            bg-white p-5 sm:p-8 rounded-2xl
            w-full sm:w-[450px]
            min-h-[45vh] sm:min-h-[60vh]
            flex flex-col
            items-center justify-center
            "
            style={{ gap: "calc(60vh * 0.03)" }}
          >
            <h2 className="text-center text-xl sm:text-4xl sm:mb-6">회원정보 수정</h2>
            <ProfileForm
              userData={userData}
              onSubmit={onSubmit}
              isLoading={isLoading}
              register={register}
              setValue={setValue}
              handleSubmit={handleSubmit}
            />
            <div className="w-full flex justify-between gap-1 sm:gap-4 sm:mt-4">
              <ModalButtons
                text="비밀번호변경"
                isLoading={isLoading}
                color="blue"
                onClick={wrapOnClick(() => setIsPasswordModalOpen(true))}
              />
              <ModalButtons
                text="회원탈퇴"
                isLoading={isLoading}
                color="red"
                onClick={wrapOnClick(() => setIsDeleteModalOpen(true))}
              />
            </div>
          </div>
        </div>
      </div>
      {isPasswordModalOpen && <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />}
      {isDeleteModalOpen && <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} userData={userData} />}
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
