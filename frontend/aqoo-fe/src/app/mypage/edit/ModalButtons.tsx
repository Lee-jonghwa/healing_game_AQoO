import { ReactNode } from "react";

interface ModalButtonProps {
  text: string;
  onClick?: () => void;
  isLoading?: boolean;
  color?: "blue" | "white" | "green" | "red" | "none";
  icon?: ReactNode;
  type?: "button" | "submit";
  isSpecial?: boolean;
}

export default function ModalButton({
  text,
  onClick,
  isLoading,
  color = "blue",
  icon,
  type = "submit",
  isSpecial = false,
}: ModalButtonProps) {
  const colorClasses = {
    blue: "bg-blue-700 text-white hover:bg-blue-800",
    white: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100",
    green: "bg-[#03C75A] text-white hover:bg-green-700",
    red: "bg-[#F00] text-white hover:bg-red-800",
    none: "",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`${
        isSpecial
          ? "m-1 p-1 px-2 min-w-[100px] sm:min-w-[240px] sm:min-h-[40px] flex items-center justify-center rounded-xl border border-[#040303] bg-white  [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset] text-[#070707] text-center font-[400] text-lg sm:text-xl"
          : "text-sm sm:text-lg w-full sm:w-full flex items-center justify-center sm:gap-2 p-[5px] sm:p-3 rounded-lg transition"
      } ${colorClasses[color]} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {icon && <span>{icon}</span>}
      <span>{isLoading ? "처리 중..." : text}</span>
    </button>
  );
}
