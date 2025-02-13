import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useAuth } from "@/hooks/useAuth";

interface PasswordChangeModalProps {
  onClose: () => void;
}

export default function PasswordChangeModal({ onClose }: PasswordChangeModalProps) {
  const API_BASE_URL = "https://i12e203.p.ssafy.io";
  const token = localStorage.getItem("accessToken");
  // 사용자 ID는 전역 상태나 localStorage 또는 useAuth 에서 가져옴.
  const { auth } = useAuth();
  const userId = localStorage.getItem("userId") || auth.user?.id || "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // 입력값 검증:
  // - 새 비밀번호와 확인이 일치하는지,
  // - 현재 비밀번호와 새 비밀번호가 다른지 확인
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
    // 모든 필드가 입력되어야 하고, 에러 메시지가 없어야 함
    if (!currentPassword || !newPassword || !confirmPassword || errorMessage) return;

    // 디버깅용: 요청 데이터 로그 출력
    console.log("비밀번호 변경 요청 데이터:", {
      userId,
      currentPassword,
      newPassword,
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      // 응답 로그 출력
      console.log("응답 상태 코드:", response.status);
      const responseData = await response.json();
      console.log("응답 데이터:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "비밀번호 변경 실패");
      }
      alert(responseData.message); // "비밀번호 변경이 완료 되었습니다."
      onClose();
    } catch (error) {
      console.error("비밀번호 변경 중 오류 발생:", error);
      alert("비밀번호 변경 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
    }
  };

  return (
    <Modal onClose={onClose} className="w-[400px] h-[450px] p-6">
      <h3 className="text-3xl font-semibold mb-4">비밀번호 변경</h3>
      <div className="space-y-4">
        {/* 현재 비밀번호 입력 */}
        <div>
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
        <div>
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
        <div>
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
        <button className="px-4 py-2 bg-gray-300 rounded mr-2" onClick={onClose}>
          취소
        </button>
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
