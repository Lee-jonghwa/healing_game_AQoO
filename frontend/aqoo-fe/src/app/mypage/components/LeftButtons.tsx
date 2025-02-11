"use client";

import Link from "next/link";

export default function LeftButtons() {
  return (
    <div className="flex flex-col justify-between m-2">
      <Link
        href="/mypage"
        className=" min-w-[80px] h-10 px-2 rounded-xl border border-[#040303] bg-white
        [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset] flex items-center justify-center text-[#070707] text-center
        font-[400] text-2xl leading-none font-[NeoDunggeunmo_Pro] "
      >
        Home
      </Link>
      <Link
        href="/mypage"
        className="
          min-w-[80px] h-10 px-2 mt-2
          rounded-xl border border-[#040303] bg-white 
          [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          flex items-center justify-center
          text-[#070707] text-center font-[400] text-2xl leading-none
          font-[NeoDunggeunmo_Pro]
        "
      >
        Logout
      </Link>
    </div>
  );
}
