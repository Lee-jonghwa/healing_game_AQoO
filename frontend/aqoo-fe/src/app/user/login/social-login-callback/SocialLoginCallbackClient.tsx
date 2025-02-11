'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function SocialLoginCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socialLogin } = useAuth();

  const handleRedirect = useCallback(async () => {
    const accessToken = searchParams.get("accessToken") || "";
    const userId = searchParams.get("userId") || "";
    const nickName = searchParams.get("nickName") || "";
    const isNewUser = searchParams.get("isNewUser") === "true";

    // socialLogin이 필요한 경우 먼저 실행
    if (accessToken && userId) {
      try {
        await socialLogin(accessToken, userId, nickName);
      } catch (error) {
        console.error("Social login failed:", error);
        router.push("/user/login");
        return;
      }
    }

    // 라우팅 로직
    if (isNewUser && accessToken === "" && nickName === "" && userId) {
      router.replace(`/user/join?email=${encodeURIComponent(userId)}`);
    } else if (accessToken && userId) { //정상 로그인시 메인페이지로 이동동
      router.replace("/main");
    } else {
      router.replace("/user/login");
    }
  }, [router, searchParams, socialLogin]);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      handleRedirect();
    }

    return () => {
      mounted = false;
    };
  }, [handleRedirect]);

  return <div>로그인 중입니다...</div>;
}