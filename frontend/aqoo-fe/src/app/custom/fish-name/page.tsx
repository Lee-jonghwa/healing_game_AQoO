"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CustomFishNamePage() {
  const router = useRouter();

  // ✅ useState로 URL Query에서 fishImage 가져오기 (useSearchParams 직접 사용 안 함)
  const [fishImage, setFishImage] = useState<string | null>(null);
  const [fishName, setFishName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ useEffect에서 클라이언트에서 실행되도록 처리 (SSR 오류 방지)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setFishImage(urlParams.get("fishImage"));
    }
  }, []);

  const handleSaveName = () => {
    if (!fishName.trim()) {
      setErrorMessage("이름을 입력하세요!");
      return;
    }

    console.log("🐠 저장된 물고기:", { name: fishName, image: fishImage });

    // ✅ 저장 후 메인 페이지로 이동
    router.push("/main");
  };

  // ✅ Enter 키 입력 시 저장 가능하도록 설정
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveName();
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-200 px-4">
      <h2 className="text-3xl font-bold text-center mb-4">🐠 물고기 이름 짓기</h2>

      {/* ✅ Next.js 최적화된 Image 사용 */}
      {fishImage ? (
        <Image
          src={fishImage}
          alt="Custom Fish"
          width={96}
          height={96}
          className="mb-4 rounded-full shadow-lg"
          priority
        />
      ) : (
        <div className="w-24 h-24 mb-4 flex items-center justify-center bg-gray-300 rounded-full">
          <span className="text-gray-600">이미지 없음</span>
        </div>
      )}

      {/* ✅ 입력 필드 */}
      <input
        type="text"
        value={fishName}
        onChange={(e) => {
          setFishName(e.target.value);
          setErrorMessage(""); // 입력 시 오류 메시지 초기화
        }}
        onKeyDown={handleKeyPress} // ✅ Enter 입력 시 저장
        className="border p-2 rounded-lg w-full max-w-[300px] text-center focus:ring-2 focus:ring-blue-500"
        placeholder="이름을 입력하세요"
        aria-label="물고기 이름 입력"
      />

      {/* ✅ 에러 메시지 UI 추가 */}
      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}

      {/* ✅ 저장 버튼 (fishName이 비어있으면 비활성화) */}
      <button
        onClick={handleSaveName}
        disabled={!fishName.trim()} // ✅ 빈 값이면 버튼 비활성화
        className={`mt-4 px-6 py-3 rounded-lg transition ${
          fishName.trim() ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
      >
        저장하기
      </button>
    </div>
  );
}
