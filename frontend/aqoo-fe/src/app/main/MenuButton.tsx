"use client";

import { useRouter } from "next/navigation";

function MenuButton({
  icon,
  label,
  onClick, // 클릭 이벤트 핸들러 추가
  isActive, // 활성화 여부 추가
  className = "", // ✅ Default to empty string if not provided
}: {
  icon: string;
  label: string;
  onClick?: () => void; // 클릭 시 실행할 함수 (옵션)
  isActive?: boolean; // 활성화 여부
  className?: string; // ✅ Accepts a className prop
}) {
  return (
    <button
      onClick={onClick} // 버튼 클릭 시 전달받은 함수 실행
      className={`${className} flex flex-col items-center justify-center p-1 rounded-lg shadow-md border border-gray-300 hover:bg-gray-200  ${
        isActive ? "bg-blue-300" : "hover:bg-gray-200 "
      } w-16 h-16`}
    >
      <img src={icon} alt={label} className="w-[32px] h-[32px]" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

export default MenuButton;
