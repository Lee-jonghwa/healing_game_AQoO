"use client";

import { useRouter } from "next/navigation";

interface ButtonsProps {
  text: string;
}

export default function Buttons({ text }: ButtonsProps) {
  const router = useRouter();

  // 버튼 클릭 시 이동할 경로 결정
  const handleNavigation = () => {
    if (text === "BACK") {
      router.push("/mypage");
    } else if (text === "완료") {
      router.push("/mypage/edit");
    }
  };

  return (
    <button
      onClick={handleNavigation}
      className="min-w-[80px] h-10 px-2 rounded-xl border border-[#040303] bg-white
      [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset] flex items-center justify-center text-[#070707] text-center
      font-[400] text-2xl leading-none"
    >
      {text}
    </button>
  );
}
