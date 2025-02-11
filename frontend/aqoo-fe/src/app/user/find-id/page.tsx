"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import InputField from "@/app/user/find-id/components/InputField";

interface FindIdFormInputs {
  email: string;
}

export default function FindIdPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FindIdFormInputs>();

  const onSubmit: SubmitHandler<FindIdFormInputs> = (data) => {
    console.log("아이디 찾기 데이터:", data);
    // 폼 제출 시, 입력한 이메일을 쿼리 파라미터로 포함하여 확인 페이지로 이동
    router.push(`/user/find-id/confirmation?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('https://i12e203.p.ssafy.io/images/bg1.png')" }}
    >
      <div className="relative bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 border-t-4 border-blue-500">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 text-blue-500 hover:underline"
        >
          뒤로가기
        </button>
        <h2 className="text-center text-3xl font-bold text-blue-900 mb-6">아이디 찾기</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <InputField
            label="이메일"
            type="email"
            placeholder="example@sea.com"
            register={register("email", { required: "이메일은 필수 입력 항목입니다." })}
            error={errors.email?.message as string}
          />
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-teal-500 transition"
          >
            아이디 찾기
          </button>
        </form>
      </div>
    </div>
  );
}
