"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/services/axiosInstance";

interface PasswordChangeModalProps {
  onClose: () => void;
}

export default function PasswordChangeModal({ onClose }: PasswordChangeModalProps) {
  // axiosInstance에 이미 baseURL과 기본 헤더가 설정되어 있으므로 별도 설정 불필요
  const { auth } = useAuth();
  const userId = localStorage.getItem("userId") || auth.user?.id || "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 입력값 검증: 새 비밀번호와 확인이 일치하는지, 현재 비밀번호와 새 비밀번호가 다른지 확인
  useEffect(() => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("새 비밀번호와 확인이 일치하지 않습니다.");
    } else if (currentPassword === newPassword) {
      setErrorMessage("현재 비밀번호와 새 비밀번호가 동일합니다.");
    } else {
      setErrorMessage("");
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword || errorMessage) return;

    console.log("비밀번호 변경 요청 데이터:", {
      userId,
      currentPassword,
      newPassword,
    });

    try {
      const response = await axiosInstance.post("/auth/change-password", {
        userId,
        currentPassword,
        newPassword,
      });

      console.log("응답 상태 코드:", response.status);
      console.log("응답 데이터:", response.data);

      alert(response.data.message);
      onClose();
    } catch (error: any) {
      console.error("비밀번호 변경 중 오류 발생:", error);
      alert("비밀번호 변경 실패: " + (error.message || "알 수 없는 오류"));
    }
  };

  return (
    <Modal onClose={onClose} className="min-w-[25%] min-h-[55%] p-6">
      <h3 className="text-center text-3xl font-semibold mb-4">비밀번호 변경</h3>
      <div className="space-y-4 w-full flex flex-col items-start justify-center">
        {/* 현재 비밀번호 입력 */}
        <div className="w-full">
          <label className="block text-gray-700 font-medium mb-1">현재 비밀번호</label>
          <input
            type="password"
            placeholder="현재 비밀번호 입력"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        {/* 새 비밀번호 입력 */}
        <div className="w-full">
          <label className="block text-gray-700 font-medium mb-1">새 비밀번호</label>
          <input
            type="password"
            placeholder="새 비밀번호 입력"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
        </div>
        {/* 새 비밀번호 확인 입력 */}
        <div className="w-full">
          <label className="block text-gray-700 font-medium mb-1">새 비밀번호 확인</label>
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
          />
          {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handlePasswordChange}
          disabled={!currentPassword || !newPassword || !confirmPassword || errorMessage !== ""}
        >
          변경하기
        </button>
      </div>
    </Modal>
  );
}
