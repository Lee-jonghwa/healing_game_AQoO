import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import axiosInstance from "@/services/axiosInstance";
import { useSFX } from "@/hooks/useSFX";

interface UserData {
  id: string;
  email: string;
  nickname: string;
  mainFishImage: string;
}

interface DeleteAccountModalProps {
  onClose: () => void;
  userData: UserData;
}

export default function DeleteAccountModal({ onClose, userData }: DeleteAccountModalProps) {
  const router = useRouter();
  const { auth } = useAuth();
  const userId = auth.user?.id || "";
  const [confirmId, setConfirmId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { play: playClick } = useSFX("/sounds/pop-01.mp3");
  const { play: playSuccess } = useSFX("/sounds/성공알림-02.mp3");

  const wrapOnClick =
    (originalOnClick?: () => void): React.MouseEventHandler<HTMLButtonElement> =>
    (event) => {
      event.preventDefault();
      playSuccess();
      if (originalOnClick) {
        originalOnClick();
      }
    };
  useEffect(() => {
    if (confirmId && confirmId !== userId) {
      setErrorMessage("입력하신 아이디가 일치하지 않습니다.");
    } else {
      setErrorMessage("");
    }
  }, [confirmId, userId]);

  const handleDeleteAccount = async () => {
    playClick();
    if (confirmId !== userId) return;

    try {
      // DELETE 메서드를 사용하며, 요청 데이터는 config의 data 속성에 넣습니다.
      const response = await axiosInstance.delete<{ message: string }, any, { userId: string }>("/users", {
        data: { userId },
      });
      // console.log("회원 탈퇴 응답:", response.data);
      alert(response.data.message || "회원 탈퇴 완료");

      // 탈퇴 후 처리: 토큰 제거 및 로그인 페이지로 이동
      // localStorage.removeItem("accessToken");
      router.push("/user/login");
    } catch (error) {
      // console.error("회원 탈퇴 중 오류:", error);
      alert("회원 탈퇴 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
    }
  };

  return (
    <Modal onClose={onClose} className="w-[600px] min-h-[350px] flex flex-col items-center justify-center">
      <h3 className="text-3xl font-semibold text-red-600 mb-4">회원 탈퇴</h3>
      <div className="flex gap-4 m-4 items-center">
        <div
          className="
            w-[170px] h-[170px] flex-shrink-0 flex items-center justify-center
            rounded-xl border border-black bg-white [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          "
        >
          <div
            className="
              w-[150px] h-[150px] flex-shrink-0 flex items-center justify-center
              border border-black bg-white [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]
            "
          >
            <img
              src={
                userData.mainFishImage.startsWith("http") ? userData.mainFishImage : `images/${userData.mainFishImage}`
              }
              alt="대표 이미지"
              width={130}
              height={130}
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>
        <p className="text-gray-600">
          어항 속 친구들이 벌써부터 보고싶어해요... 🐠 <br />
          조금 더 우리와 함께 헤엄쳐요, 네? 🌊 <br />
          헤엄치던 물고기들이 슬퍼할 거예요... 🐟💧
        </p>
      </div>
      <div className="w-full px-4">
        <label className="block text-gray-700 font-medium mb-1">회원 탈퇴 확인</label>
        <input
          type="text"
          placeholder="회원님의 아이디를 입력하세요"
          value={confirmId}
          onChange={(e) => setConfirmId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
        />
        {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
      </div>
      <div className="flex justify-end m-4 gap-5">
        <button className="px-4 py-2 bg-blue-700 rounded w-[200px] text-white" onClick={wrapOnClick(onClose)}>
          다시 한 번 생각한다.
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded w-[200px]"
          onClick={handleDeleteAccount}
          disabled={confirmId !== userId}
        >
          차갑게 떠난다.
        </button>
      </div>
    </Modal>
  );
}
