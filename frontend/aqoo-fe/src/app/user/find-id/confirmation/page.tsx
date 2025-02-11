"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

interface FindIdResponseSuccess {
  userId: string;
}

interface FindIdResponseError {
  message: string;
}

// 실제 컨텐츠를 보여주는 컴포넌트
function FindIdContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<FindIdResponseSuccess | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!email) {
      setError("이메일 정보가 없습니다.");
      setLoading(false);
      return;
    }

    axios
      .post("https://i12e203.p.ssafy.io/api/v1/auth/find-id", { email })
      .then((res) => {
        if (res.data && res.data.userId) {
          setResult({ userId: res.data.userId });
        } else {
          setError("등록된 아이디가 없습니다.");
        }
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError("아이디 찾기 중 오류가 발생했습니다.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [email]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('https://i12e203.p.ssafy.io/images/bg1.png')" }}
    >
      <div className="relative bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 border-t-4 border-blue-500">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 text-blue-500 hover:underline"
        >
          뒤로가기
        </button>
        <h2 className="text-center text-3xl font-bold text-blue-900 mb-6">아이디 찾기 결과</h2>
        {loading ? (
          <div>로딩 중...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : result ? (
          <div className="text-center text-lg">
            <p>등록된 아이디: {result.userId}</p>
          </div>
        ) : (
          <div className="text-center text-lg">아이디를 찾을 수 없습니다.</div>
        )}
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function FindIdConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FindIdContent />
    </Suspense>
  );
}