"use client";

import Image from "next/image";
import Link from "next/link";

export default function Profile() {
  return (
    <div
      className="
        m-2
        w-[1300px] h-[200px]
        rounded-[30px] bg-[#fffdfd]
        border-2 border-[#1c5e8d]
        [box-shadow:-2px_-2px_0px_2px_rgba(0,0,0,0.25)_inset]
        flex justify-between items-center
      "
    >
      {/* 좌측: 초상화 + 레벨/닉네임/정보 */}
      <div className="flex gap-2 justify-center ml-2 p-3">
        {/* 초상화 컨테이너 */}
        <div
          className="
            w-[170px] h-[170px] flex-shrink-0
            flex items-center justify-center
            rounded-xl border border-black bg-white
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
          "
        >
          {/* 실제 초상화 */}
          <div
            className="
              w-[150px] h-[150px] flex-shrink-0
              flex items-center justify-center
              border border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.25)_inset]
            "
          >
            <Image
              src="/images/대표이미지샘플.png"
              alt="대표 이미지"
              width={130}
              height={130}
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>

        {/* 레벨/닉네임/총 물고기 등 텍스트 */}
        <div className="flex flex-col justify-center">
          <p
            className="
              min-w-[200px] h-10 flex-shrink-0 mt-2 mb-2 px-2
              flex items-center
              text-[#070707] text-center text-2xl font-[400] leading-normal
              rounded-xl border-[3px] border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.5)_inset]
            "
          >
            레벨: 1234
          </p>
          <p
            className="
              min-w-[200px] h-10 flex-shrink-0 mb-2 px-2
              flex items-center
              text-[#070707] text-center text-2xl font-[400] leading-normal
              rounded-xl border-[3px] border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.5)_inset]
            "
          >
            닉네임: 회사랑김싸피
          </p>
          <p
            className="
              min-w-[200px] h-10 flex-shrink-0 mb-2 px-2
              flex items-center
              text-[#070707] text-center text-2xl font-[400] leading-normal
              rounded-xl border-[3px] border-black bg-white
              [box-shadow:1px_1px_0px_1px_rgba(0,0,0,0.5)_inset]
            "
          >
            총 물고기 갯수: 100 마리
          </p>
        </div>
      </div>

      {/* 우측: 회원정보수정 버튼 */}
      <div className="self-start m-2 mr-5">
        <Link
          href="/mypage/edit"
          className="
            min-w-[80px] h-10 px-2
            rounded-xl border border-[#040303] bg-white 
            [box-shadow:-2px_-2px_0px_1px_rgba(0,0,0,0.5)_inset]
            flex items-center justify-center
            text-[#070707] text-center font-[400] text-2xl
          "
        >
          회원정보수정
        </Link>
      </div>
    </div>
  );
}
