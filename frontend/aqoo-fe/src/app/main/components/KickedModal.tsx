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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-xs w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">알림</h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-6">추방되었습니다.</p>
            <button
              onClick={handleCloseModal}
              className="mx-auto block bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-6 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-colors duration-200"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
  
  
}
