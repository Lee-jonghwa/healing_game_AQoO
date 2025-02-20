// 파일: app/user/find-password/page.tsx
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import InputField from "@/app/user/find-password/components/InputField";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

interface RequestFormInputs {
  userId: string;
  email: string;
}

interface VerifyFormInputs {
  authCode: string;
}

function FindPasswordPageContent() {
  const { showToast } = useToast();

  const router = useRouter();
  const API_BASE_URL = "https://i12e203.p.ssafy.io/api/v1";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormInputs>();
  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: errorsVerify },
    setError: setVerifyError,
  } = useForm<VerifyFormInputs>();

  const [step, setStep] = useState<"request" | "verify">("request");
  const [timer, setTimer] = useState<number>(180);
  const [userId, setUserId] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "verify" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const onSubmitRequest: SubmitHandler<RequestFormInputs> = async (data) => {
    setIsSending(true);
    try {
      await axios.post(`${API_BASE_URL}/email/send`, {
        userId: data.userId,
        email: data.email,
      });
      setUserId(data.userId);
      setStep("verify");
      setTimer(180);
    } catch (error) {
      console.error("인증번호 전송 실패", error);
    } finally {
      setIsSending(false);
    }
  };

  const onSubmitVerify: SubmitHandler<VerifyFormInputs> = async (data) => {
    setIsVerifying(true);
    try {
      await axios.post(`${API_BASE_URL}/email/verify`, {
        authPassword: data.authCode,
      });
      router.push(`/user/find-password/reset?userId=${userId}`);
    } catch (error: any) {
      if (error.response && error.response.status === 500) {
        setVerifyError("authCode", {
          type: "manual",
          message: "인증번호가 잘못되었습니다.",
        });
      } else {
        showToast("인증번호 확인 중 오류가 발생했습니다.", "error");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
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
        <button onClick={() => router.back()} className="absolute top-4 left-4 text-blue-500 hover:underline">
          뒤로가기
        </button>
        <h2 className="text-center text-3xl font-bold text-blue-900 mb-6">비밀번호 찾기</h2>
        {step === "request" && (
          <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-6">
            <InputField
              label="아이디"
              type="text"
              placeholder="아이디 입력"
              {...register("userId", { required: "아이디는 필수 입력 항목입니다." })}
              error={errors.userId?.message as string}
            />
            <InputField
              label="이메일"
              type="email"
              placeholder="example@sea.com"
              {...register("email", { required: "이메일은 필수 입력 항목입니다." })}
              error={errors.email?.message as string}
            />
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-teal-500 transition"
            >
              {isSending ? "로딩중..." : "인증번호 전송"}
            </button>
          </form>
        )}
        {step === "verify" && (
          <form onSubmit={handleSubmitVerify(onSubmitVerify)} className="space-y-6">
            <div className="text-center text-xl font-semibold text-blue-800 mb-4">남은 시간: {formatTime(timer)}</div>
            <InputField
              label="인증번호"
              type="text"
              placeholder="인증번호 입력"
              {...registerVerify("authCode", { required: "인증번호는 필수 입력 항목입니다." })}
              error={errorsVerify.authCode?.message as string}
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-teal-400 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-teal-500 transition"
            >
              {isVerifying ? "로딩중..." : "확인"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function FindPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <p>Loading...</p>
        </div>
      }
    >
      <FindPasswordPageContent />
    </Suspense>
  );
}
