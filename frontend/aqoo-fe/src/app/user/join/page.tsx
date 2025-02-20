"use client";

import React, { Suspense } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import InputField from "@/app/user/join/components/InputField";
import axios from "axios";
import { useToast } from "@/hooks/useToast";

interface JoinFormInputs {
  email: string;
  id: string;
  password: string; // 실제 비밀번호
  pw: string; // 비밀번호 확인
  nickName: string;
}

function JoinPageContent() {
  const { showToast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 쿼리에서 email 값이 있다면 소셜 가입으로 간주합니다.
  const prefillEmail = searchParams.get("email") || "";
  const isSocialJoin = Boolean(prefillEmail);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinFormInputs>({
    defaultValues: {
      email: prefillEmail,
      id: prefillEmail, // 소셜 가입이면 이메일과 아이디가 동일한 값으로 채워집니다.
      password: "",
      pw: "",
      nickName: "",
    },
  });

  // 이메일 유효성 검사 함수
  const validateEmail = async (value: string): Promise<boolean | string> => {
    try {
      const response = await axios.post("https://i12e203.p.ssafy.io/api/v1/auth/validate-email", { email: value });
      return response.data.valid || "이미 사용 중인 이메일입니다.";
    } catch (error) {
      return "이메일 검증 중 오류가 발생했습니다.";
    }
  };

  // 아이디 유효성 검사 함수
  const validateId = async (value: string): Promise<boolean | string> => {
    try {
      const response = await axios.post("https://i12e203.p.ssafy.io/api/v1/auth/validate-id", { userId: value });
      return response.data.valid || "이미 사용 중인 아이디입니다.";
    } catch (error) {
      return "아이디 검증 중 오류가 발생했습니다.";
    }
  };

  const onSubmit: SubmitHandler<JoinFormInputs> = async (data) => {
    // 일반 가입인 경우, 비밀번호와 비밀번호 확인이 일치하는지 검증합니다.
    if (!isSocialJoin && data.password !== data.pw) {
      showToast("비밀번호와 비밀번호 확인이 일치하지 않습니다.", "warning");
      return;
    }

    // 요청 본문에 소셜 로그인 여부를 추가하고, 실제 비밀번호를 pw 필드로 설정합니다.
    const requestBody = {
      email: data.email,
      id: data.id,
      pw: data.password, // 실제 비밀번호를 pw 필드에 할당
      nickName: data.nickName,
      isSocialLogin: isSocialJoin,
    };

    try {
      // axios를 사용하여 회원가입 API 호출 (전체 경로: BASE_URL + /auth/register)
      const response = await axios.post("https://i12e203.p.ssafy.io/api/v1/auth/register", requestBody);
      // console.log("회원가입 성공:", response.data);
      showToast("회원가입 성공!", "success");
      router.push("/user/login");
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      showToast("회원가입 실패 : " + error.message, "error");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-cover bg-center relative">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-black before:absolute before:inset-0 before:bg-white/30"
        style={{
          backgroundImage: "url(/background-1.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>
      <div className="relative bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 border-t-4 border-blue-500">
        {/* 뒤로가기 버튼 (카드 왼쪽 상단) */}
        <button onClick={() => router.back()} className="absolute top-4 left-4 text-blue-500 hover:underline">
          뒤로가기
        </button>
        <h2 className="text-center text-3xl font-bold text-blue-900 mb-6">회원가입</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 일반 가입인 경우에만 이메일, 아이디, 비밀번호, 비밀번호 확인 필드 렌더링 */}
          {!isSocialJoin && (
            <>
              <InputField
                label="이메일"
                type="email"
                placeholder="example@sea.com"
                register={register("email", {
                  required: "필수 입력 항목입니다.",
                  validate: validateEmail,
                })}
                error={errors.email?.message as string}
              />
              <InputField
                label="아이디"
                type="text"
                placeholder="아이디"
                register={register("id", {
                  required: "필수 입력 항목입니다.",
                  validate: validateId,
                })}
                error={errors.id?.message as string}
              />
              <InputField
                label="비밀번호"
                type="password"
                placeholder="비밀번호"
                register={register("password", { required: "필수 입력 항목입니다." })}
                error={errors.password?.message as string}
              />
              <InputField
                label="비밀번호 확인"
                type="password"
                placeholder="비밀번호 확인"
                register={register("pw", { required: "필수 입력 항목입니다." })}
                error={errors.pw?.message as string}
              />
            </>
          )}
          {/* 소셜 가입인 경우에는 이메일, 아이디, 비밀번호, 비밀번호 확인 필드를 숨기고 닉네임만 표시 */}
          <InputField
            label="닉네임"
            type="text"
            placeholder="닉네임"
            register={register("nickName", { required: "필수 입력 항목입니다." })}
            error={errors.nickName?.message as string}
          />
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-teal-500 transition"
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <JoinPageContent />
    </Suspense>
  );
}
