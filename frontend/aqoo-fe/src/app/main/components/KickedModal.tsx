"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function KickedModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kicked = searchParams.get("status") === "kicked";
  const [showKickedModal, setShowKickedModal] = useState(kicked);

  const handleCloseModal = () => {
    setShowKickedModal(false);
    // URL에서 'status' 파라미터 제거 후 메인페이지로 replace 이동
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("status");
    router.replace(currentUrl.toString());
  };

  return (
    <>
      {showKickedModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md">
            <p className="text-lg text-red-700 mb-4">추방되었습니다.</p>
            <button
              onClick={handleCloseModal}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
