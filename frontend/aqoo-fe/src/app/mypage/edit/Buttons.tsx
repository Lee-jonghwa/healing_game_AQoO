"use client";

import { useSFX } from "@/hooks/useSFX";
import { useRouter } from "next/navigation";

interface ButtonsProps {
  text: string;
}

export default function Buttons({ text }: ButtonsProps) {
  const router = useRouter();
  const { play: playClick } = useSFX("/sounds/pop-01.mp3")
  // 버튼 클릭 시 이동할 경로 결정
  const handleNavigation = () => {
    playClick()
    if (text === "BACK") {
      router.push("/mypage");
    } else if (text === "완료") {
      router.push("/mypage/edit");
    }
  };

  return (
    <button
      onClick={handleNavigation}
      className="
      min-w-[40px] sm:min-w-[80px] h-7 sm:h-10 px-2
      rounded-xl border border-[#040303] bg-white
      [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
      flex items-center justify-center text-[#070707] text-center
      font-[400] text-md sm:text-2xl leading-none"
    >
      {text}
    </button>
  );
}
