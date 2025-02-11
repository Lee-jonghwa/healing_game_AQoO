"use client";

import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { FcGoogle } from "react-icons/fc";
import InputField from "@/app/user/login/components/InputField";
import LoginButton from "@/app/user/login/components/LoginButton";
import { SiNaver } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface LoginFormInputs {
  id: string;
  pw: string;
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFormInputs>();
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 일반 로그인 처리
  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      await login(data.id, data.pw);
      router.push("/main");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 소셜 로그인 버튼 클릭 시, 백엔드의 OAuth2 엔드포인트로 브라우저를 이동합니다.
   */
  const handleSocialLogin = (provider: "google" | "naver") => {
    const url = provider === "google" ? "/oauth2/authorization/google" : "/oauth2/authorization/naver";
    window.location.href = url;
  };

  // 모달에서 "아이디 찾기" 선택 시 호출되는 함수
  const handleFindId = () => {
    setIsModalOpen(false);
    router.push("/user/find-id");
  };

  // 모달에서 "비밀번호 찾기" 선택 시 호출되는 함수
  const handleFindPassword = () => {
    setIsModalOpen(false);
    router.push("/user/find-password");
  };

  return (
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('https://i12e203.p.ssafy.io/images/bg1.png')" }}
    >
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 border-t-4 border-blue-500">
        <h2 className="text-center text-3xl font-bold text-blue-900 mb-6">로그인</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <InputField label="아이디" placeholder="아이디" register={register("id", { required: true })} />
          <InputField
            label="비밀번호"
            type="password"
            placeholder="비밀번호"
            register={register("pw", { required: true })}
          />
          {/* 아이디/비밀번호 찾기 버튼 */}
          <div className="text-right text-sm">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-blue-500 hover:underline"
            >
              아이디 / 비밀번호 찾기
            </button>
          </div>
          <LoginButton text="로그인" color="blue" isLoading={isLoading} />
        </form>

        {/* 소셜 로그인 버튼들 */}
        <div className="mt-4 space-y-2">
          <LoginButton
            text="구글로 로그인"
            color="white"
            icon={<FcGoogle size={20} />}
            type="button"
            onClick={() => handleSocialLogin("google")}
          />
          <LoginButton
            text="네이버로 로그인"
            color="green"
            icon={<SiNaver size={20} color="white" />}
            type="button"
            onClick={() => handleSocialLogin("naver")}
          />
        </div>

        {/* 회원가입 버튼 */}
        <div className="mt-6 text-center">
          <button onClick={() => router.push("/user/join")} className="text-blue-500 hover:underline">
            회원가입
          </button>
        </div>
      </div>

      {/* 모달 영역 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">찾으실 항목을 선택해주세요</h3>
            <div className="flex gap-4">
              <button
                onClick={handleFindId}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                아이디 찾기
              </button>
              <button
                onClick={handleFindPassword}
                className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
              >
                비밀번호 찾기
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 text-sm text-blue-500 hover:underline"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
