import { ReactNode } from "react";

interface LoginButtonProps {
  text: string;
  onClick?: () => void;
  isLoading?: boolean;
  color?: "blue" | "white" | "green";
  icon?: ReactNode;
  type?: "button" | "submit";
}

export default function LoginButton({
  text,
  onClick,
  isLoading,
  color = "blue",
  icon,
  type = "submit",
}: LoginButtonProps) {
  // 구글 로그인 버튼(white)은 기존 스타일 그대로 사용합니다.
  const colorClasses = {
    blue: "bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-teal-500 transition",
    white: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100", // 그대로 유지
    green: "bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-700 transition",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 p-3 ${colorClasses[color]} ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {icon && <span>{icon}</span>}
      <span>{isLoading ? "처리 중..." : text}</span>
    </button>
  );
}
