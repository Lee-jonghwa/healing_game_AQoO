"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useUsers } from "@/hooks/useUsers"; // React Query 훅 (전체 유저 목록을 가져온다고 가정)

export default function AuthAndUsersTestPage() {
  const { auth, logout } = useAuth();
  const { data: users, isPending, error } = useUsers();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/user/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold">🔑 Recoil + React Query 테스트</h1>

      {/* 로그인 상태 테스트 */}
      <div className="mt-4 p-4 border rounded-lg shadow max-w-md w-full">
        <h2 className="text-lg font-semibold">🛠 로그인 상태</h2>
        <p>{auth.isAuthenticated ? "✅ 로그인됨" : "❌ 로그아웃됨"}</p>
        {auth.user && (
          <div className="mt-2">
            <p>👤 사용자 ID: {auth.user.id}</p>
          </div>
        )}
        <div className="mt-2">
          {auth.isAuthenticated ? (
            <button
              className="px-4 py-2 bg-red-500 text-white rounded"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          ) : (
            <p>로그인이 필요합니다.</p>
          )}
        </div>
      </div>

      {/* 유저 목록 테스트 */}
      <div className="mt-8 p-4 border rounded-lg shadow max-w-md w-full">
        <h2 className="text-lg font-semibold">🌍 전체 유저 목록</h2>
        {isPending && <p>⏳ 데이터 로딩 중...</p>}
        {error && <p>❌ 데이터 가져오기에 실패했습니다.</p>}
        {users && (
          <ul className="mt-2">
            {users?.map((user) => (
              <li key={user.id} className="text-lg">
                {user.id}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
