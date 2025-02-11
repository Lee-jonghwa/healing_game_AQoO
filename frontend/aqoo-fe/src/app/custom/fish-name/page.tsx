"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useState } from "react";

export default function CustomFishNamePages() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fishImage = searchParams.get("fishImage");

  const [fishName, setFishName] = useState("");

  const handleSaveName = () => {
    if (!fishName) return alert("이름을 입력하세요!");

    console.log("🐠 저장된 물고기:", { name: fishName, image: fishImage });

    // 🚀 저장 후 메인 페이지로 이동
    router.push("/main");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-200">
      <h2 className="text-3xl font-bold text-center mb-4">🐠 물고기 이름 짓기</h2>

      {fishImage && <img src={fishImage} alt="Custom Fish" className="w-24 h-24 mb-4" />}

      <input
        type="text"
        value={fishName}
        onChange={(e) => setFishName(e.target.value)}
        className="border p-2 rounded-lg w-full text-center"
        placeholder="이름을 입력하세요"
      />

      <button onClick={handleSaveName} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg">
        저장하기
      </button>
    </div>
  );
}
