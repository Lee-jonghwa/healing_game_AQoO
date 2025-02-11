"use client";

import { useRouter } from "next/navigation";

function MenuButton({
  icon,
  label,
  onClick, // 클릭 이벤트 핸들러 추가
}: {
  icon: string;
  label: string;
  onClick?: () => void; // 클릭 시 실행할 함수 (옵션)
}) {
  return (
    <button
      onClick={onClick} // 버튼 클릭 시 전달받은 함수 실행
      className="flex flex-col items-center justify-center w-20 h-20 bg-white rounded-lg shadow-md border border-gray-300 hover:bg-gray-200"
    >
      <img src={icon} alt={label} className="w-12 h-12" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

export default MenuButton;
